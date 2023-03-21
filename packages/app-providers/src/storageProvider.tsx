import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react";
import { StorageCtx } from "@darwinia/app-types";
import { useWallet } from "./walletProvider";
import { WsProvider, ApiPromise } from "@polkadot/api";
import useLedger from "./hooks/useLedger";
import { keyring } from "@polkadot/ui-keyring";
import { StorageKey } from "@polkadot/types";
import type { AnyTuple, Codec } from "@polkadot/types/types";
import { Contract, ethers } from "ethers";
import { createMultiSigAccount } from "@darwinia/app-utils";

const initialState: StorageCtx = {
  migrationAssetDistribution: undefined,
  isLoadingLedger: undefined,
  isLoadingMigratedLedger: false,
  retrieveMigratedAsset: (sourceAccountId: string, parentBlockHash: string) => {
    //ignore
  },
  checkEVMAccountStatus: async () => {
    return Promise.resolve();
  },
  isAccountFree: undefined,
  migratedAssetDistribution: undefined,
  multisigContract: undefined,
};

export type UnSubscription = () => void;

const StorageContext = createContext(initialState);

export const StorageProvider = ({ children }: PropsWithChildren) => {
  const { selectedNetwork, selectedAccount, apiPromise } = useWallet();
  const [isAccountFree, setAccountFree] = useState(false);
  const [multisigContract, setMultisigContract] = useState<Contract>();

  const {
    isLoadingLedger,
    stakedAssetDistribution: migrationAssetDistribution,
    isLoadingMigratedLedger,
    retrieveMigratedAsset,
    migratedAssetDistribution,
  } = useLedger({
    apiPromise,
    selectedAccount: selectedAccount?.formattedAddress,
    selectedNetwork,
  });

  const isKeyringInitialized = useRef<boolean>(false);

  /* This will help us to extract pretty names from the chain test accounts such as Alith,etc */
  useEffect(() => {
    try {
      if (selectedNetwork && !isKeyringInitialized.current) {
        isKeyringInitialized.current = true;
        keyring.loadAll({
          type: "ethereum",
          isDevelopment: selectedNetwork?.name === "Pangolin",
        });
      }
    } catch (e) {
      //ignore
    }
  }, [selectedNetwork]);

  const checkEVMAccountStatus = useCallback(
    async (accountId: string): Promise<void> => {
      setAccountFree(true);
      if (!apiPromise) {
        return Promise.resolve();
      }
      try {
        const subscription = await apiPromise.query.system.account.entries(
          (allAccounts: [StorageKey<AnyTuple>, Codec][]) => {
            for (let i = 0; i < allAccounts.length; i++) {
              const idArray = allAccounts[i][0].toHuman() as [string];
              if (accountId.toLowerCase() === idArray[0].toLowerCase()) {
                setAccountFree(false);
                break;
              }
            }
          }
        );

        return Promise.resolve();
      } catch (e) {
        setAccountFree(true);
        return Promise.resolve();
      }
    },
    [apiPromise]
  );

  useEffect(() => {
    if (!selectedAccount || !selectedNetwork) {
      return;
    }
    //refresh the page with the newly selected account
    const newProvider = new ethers.providers.Web3Provider(window.ethereum);
    const newSigner = newProvider.getSigner();
    const newMultisigContract = new ethers.Contract(
      selectedNetwork.contractAddresses.multisig,
      selectedNetwork.contractInterface.multisig,
      newSigner
    );

    setMultisigContract(newMultisigContract);
  }, [selectedAccount, selectedNetwork]);

  return (
    <StorageContext.Provider
      value={{
        checkEVMAccountStatus,
        isAccountFree,
        migrationAssetDistribution,
        isLoadingLedger,
        isLoadingMigratedLedger,
        retrieveMigratedAsset,
        migratedAssetDistribution,
        multisigContract,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => useContext(StorageContext);
