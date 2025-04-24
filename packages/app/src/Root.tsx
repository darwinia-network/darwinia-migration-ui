import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { notification, Spinner } from "@darwinia/ui";
import { useStorage, useWallet } from "@darwinia/app-providers";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getStore, setStore } from "@darwinia/app-utils";
import { localeKeys, useAppTranslation } from "@darwinia/app-locale";

const Root = () => {
  const {
    isRequestingWalletConnection,
    error,
    connectWallet,
    isWalletConnected,
    selectedNetwork,
    isLoadingTransaction,
    walletConfig,
    setMultisig,
    isLoadingBalance,
    isLoadingMultisigBalance,
    isMultisig,
    isCheckingMultisigCompleted,
    ethereumError,
  } = useWallet();
  const { isLoadingLedger, isLoadingMigratedLedger } = useStorage();
  const [loading, setLoading] = useState<boolean | undefined>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppTranslation();

  useEffect(() => {
    if (isMultisig) {
      setLoading(
        isRequestingWalletConnection ||
          isLoadingTransaction ||
          isLoadingBalance ||
          isLoadingMultisigBalance ||
          isCheckingMultisigCompleted,
      );
    } else {
      setLoading(
        isRequestingWalletConnection ||
          isLoadingTransaction ||
          isLoadingLedger ||
          isLoadingMigratedLedger ||
          isLoadingBalance,
      );
    }
  }, [
    isRequestingWalletConnection,
    isWalletConnected,
    isLoadingTransaction,
    isLoadingLedger,
    isLoadingMigratedLedger,
    isLoadingBalance,
    isLoadingMultisigBalance,
    isCheckingMultisigCompleted,
  ]);

  const redirect = useCallback(() => {
    setStore("isConnectedToWallet", true);
    if (location.pathname === "/") {
      if (setMultisig) {
        setMultisig(false);
      }
      navigate(`/migration${location.search}`, { replace: true });
      return;
    }

    if (location.pathname === "/multisig-home") {
      /*The user is connected to the wallet but still trying to visit the connect wallet page*/
      if (setMultisig) {
        setMultisig(true);
      }
      const params = new URLSearchParams(location.search);
      const redirectPath = params.get("redirect");
      params.delete("redirect");
      const destination = redirectPath ? redirectPath : "/multisig-migration";

      navigate(`${destination}?${params.toString()}`, { replace: true });
      return;
    }

    /* only navigate if the user is supposed to be redirected to another URL */
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      params.delete("redirect");
      navigate(`${redirectPath}?${params.toString()}`, { replace: true });
    }
  }, [location, navigate, setMultisig]);

  /*Monitor wallet connection and redirect to the required location */
  useEffect(() => {
    if (isWalletConnected) {
      redirect();
    } else {
      // the wallet isn't connected
      if (location.pathname === "/") {
        if (setMultisig) {
          setMultisig(false);
        }
      } else if (location.pathname.includes("multisig")) {
        if (setMultisig) {
          setMultisig(true);
        }
      }
    }
  }, [isWalletConnected, location]);

  useEffect(() => {
    if (error) {
      switch (error.code) {
        case 1: {
          /*The user has not installed the wallet*/
          notification.error({
            message: (
              <div
                dangerouslySetInnerHTML={{
                  __html: t(localeKeys.installWalletReminder, {
                    walletName: walletConfig?.name,
                    downloadURL: walletConfig?.extensions[0].downloadURL,
                  }),
                }}
              />
            ),
            duration: 10000,
          });
          break;
        }
        default: {
          notification.error({
            message: <div>{error.message}</div>,
          });
        }
      }
    }
  }, [error, walletConfig]);

  useEffect(() => {
    if (ethereumError) {
      switch (ethereumError.code) {
        case 0: {
          /*The user has not installed the wallet*/
          notification.error({
            message: (
              <div
                dangerouslySetInnerHTML={{
                  __html: t(localeKeys.installWalletReminder, {
                    walletName: "MetaMask",
                    downloadURL: "https://metamask.io/",
                  }),
                }}
              />
            ),
            duration: 10000,
          });
          break;
        }
        case 1: {
          /*The user rejected adding the network configurations*/
          notification.error({
            message: <div>{t(localeKeys.chainAdditionRejected)}</div>,
            duration: 10000,
          });
          break;
        }
        case 4: {
          /*Configurations were added but the user rejected the account access permission*/
          notification.error({
            message: <div>{t(localeKeys.accountPermissionRejected)}</div>,
          });
          break;
        }
        default: {
          notification.error({
            message: <div>{ethereumError.message}</div>,
          });
        }
      }
    }
  }, [ethereumError]);

  //check if it should auto connect to wallet or wait for the user to click the connect wallet button
  // no need to auto connect so as to allow
  /*useEffect(() => {
    const shouldAutoConnect = getStore<boolean>("isConnectedToWallet");
    if (shouldAutoConnect && walletConfig) {
      connectWallet(walletConfig.name);
    }
  }, [selectedNetwork, walletConfig]);
  }, [selectedNetwork]);*/

  return (
    <Spinner isLoading={!!loading} maskClassName={"!fixed !z-[99]"}>
      <div className={"w-full"}>
        <Header />
        <div className={"flex flex-col min-h-screen justify-center flex-1 pt-[80px] lg:pt-[90px]"}>
          {/*apply padding*/}
          <div className={"flex flex-1 flex-col wrapper-padding items-center"}>
            {/*apply max-width*/}
            <div className={"flex flex-col flex-1 app-container w-full"}>
              <Outlet />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </Spinner>
  );
};

export default Root;
