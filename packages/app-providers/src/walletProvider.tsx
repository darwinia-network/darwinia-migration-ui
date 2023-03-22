import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react";
import { dAppSupportedWallets } from "@darwinia/app-config";
import {
  ChainConfig,
  WalletCtx,
  WalletError,
  SupportedWallet,
  WalletConfig,
  CustomInjectedAccountWithMeta,
  AssetBalance,
  SpVersionRuntimeVersion,
  PalletVestingVestingInfo,
  DarwiniaAccountMigrationAssetAccount,
} from "@darwinia/app-types";
import { ApiPromise, WsProvider, SubmittableResult } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { Signer } from "@polkadot/api/types";
import useAccountPrettyName from "./hooks/useAccountPrettyName";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { keyring } from "@polkadot/ui-keyring";
import BigNumber from "bignumber.js";
import { FrameSystemAccountInfo } from "@darwinia/api-derive/accounts/types";
import { UnSubscription } from "./storageProvider";
import { Option, Vec } from "@polkadot/types";
import { convertToSS58, setStore, getStore, isMobile } from "@darwinia/app-utils";

/*This is just a blueprint, no value will be stored in here*/
const initialState: WalletCtx = {
  isRequestingWalletConnection: false,
  isWalletConnected: false,
  error: undefined,
  selectedAccount: undefined,
  setSelectedAccount: (account: CustomInjectedAccountWithMeta) => {
    //do nothing
  },
  injectedAccounts: undefined,
  selectedNetwork: undefined,
  isLoadingTransaction: undefined,
  isAccountMigratedJustNow: undefined,
  walletConfig: undefined,
  isLoadingBalance: undefined,
  changeSelectedNetwork: () => {
    // do nothing
  },
  connectWallet: () => {
    //do nothing
  },
  disconnectWallet: () => {
    //do nothing
  },
  forceSetAccountAddress: (address: string) => {
    //do nothing
  },
  setTransactionStatus: (isLoading: boolean) => {
    //do nothing
  },
  onInitMigration: (start: string, to: string, callback: (isSuccessful: boolean) => void) => {
    //do nothing
    return Promise.resolve(true);
  },
};

const WalletContext = createContext<WalletCtx>(initialState);

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [signer, setSigner] = useState<Signer>();
  const [isRequestingWalletConnection, setRequestingWalletConnection] = useState<boolean>(false);
  const [isWalletConnected, setWalletConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CustomInjectedAccountWithMeta>();
  const [injectedAccounts, setInjectedAccounts] = useState<CustomInjectedAccountWithMeta[]>();
  const injectedAccountsRef = useRef<InjectedAccountWithMeta[]>([]);
  const forcedAccountAddress = useRef<string>();
  const [error, setError] = useState<WalletError | undefined>(undefined);
  const [selectedNetwork, setSelectedNetwork] = useState<ChainConfig>();
  const [walletConfig, setWalletConfig] = useState<WalletConfig>();
  const [isLoadingTransaction, setLoadingTransaction] = useState<boolean>(false);
  const [isLoadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [apiPromise, setApiPromise] = useState<ApiPromise>();
  const { getPrettyName } = useAccountPrettyName(apiPromise);
  const DARWINIA_APPS = "darwinia/apps";
  const isKeyringInitialized = useRef<boolean>(false);
  const [isAccountMigratedJustNow, setAccountMigratedJustNow] = useState<boolean>(false);
  const [specName, setSpecName] = useState<string>();
  const [selectedWallet, _setSelectedWallet] = useState<SupportedWallet | null | undefined>();

  const setSelectedWallet = useCallback((name: SupportedWallet | null | undefined) => {
    _setSelectedWallet(name);
    setStore('selectedWallet', name);
  }, []);

  useEffect(() => {
    _setSelectedWallet(getStore('selectedWallet'));
  }, []);

  useEffect(() => {
    const walletConfig = dAppSupportedWallets.find((walletConfig) => walletConfig.name === selectedWallet);
    if (walletConfig) {
      setWalletConfig(walletConfig);
    }
  }, [selectedWallet]);

  /* This will help us to extract pretty names from the chain test accounts such as Alith,etc */
  useEffect(() => {
    try {
      if (selectedNetwork && !isKeyringInitialized.current) {
        isKeyringInitialized.current = true;
        keyring.loadAll({
          type: "sr25519",
          isDevelopment: selectedNetwork?.name === "Pangolin",
        });
      }
    } catch (e) {
      //ignore
    }
  }, [selectedNetwork]);

  const disconnectWallet = useCallback(() => {
    setSelectedAccount(undefined);
    setWalletConnected(false);
  }, []);

  const getAccountBalance = useCallback(
    async (accountAddress: string): Promise<AssetBalance> => {
      if (!apiPromise) {
        return Promise.resolve({
          ring: BigNumber(0),
          kton: BigNumber(0),
        });
      }

      let transferableKTON = BigNumber(0);
      const ktonAccountInfo: Option<DarwiniaAccountMigrationAssetAccount> =
        (await apiPromise.query.accountMigration.ktonAccounts(
          accountAddress
        )) as unknown as Option<DarwiniaAccountMigrationAssetAccount>;
      if (ktonAccountInfo.isSome) {
        const unwrappedKTONAccount = ktonAccountInfo.unwrap();
        const decodedKTONAccount = unwrappedKTONAccount.toHuman() as unknown as DarwiniaAccountMigrationAssetAccount;
        const ktonBalanceString = decodedKTONAccount.balance.toString().replaceAll(",", "");
        transferableKTON = BigNumber(ktonBalanceString);
      }

      /*We don't need to listen to account changes since the chain won't be producing blocks
       * by that time */
      const response = await apiPromise.query.accountMigration.accounts(accountAddress);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const accountInfoOption = response as unknown as Option<FrameSystemAccountInfo>;
      if (accountInfoOption.isSome) {
        let vestedAmountRing = BigNumber(0);
        let totalBalance = BigNumber(0);

        const unwrappedAccountInfo = accountInfoOption.unwrap();
        const accountInfo = unwrappedAccountInfo.toHuman() as unknown as FrameSystemAccountInfo;
        const balance = accountInfo.data.free.toString().replaceAll(",", "");
        totalBalance = BigNumber(balance);

        const vestingInfoOption = (await apiPromise.query.accountMigration.vestings(
          accountAddress
        )) as unknown as Option<Vec<PalletVestingVestingInfo>>;
        if (vestingInfoOption.isSome) {
          const unwrappedVestingInfo = vestingInfoOption.unwrap();
          const vestingInfoList = unwrappedVestingInfo.toHuman() as unknown as Vec<PalletVestingVestingInfo>;
          vestingInfoList.forEach((vesting) => {
            const lockedAmount = vesting.locked.toString().replaceAll(",", "");
            vestedAmountRing = vestedAmountRing.plus(lockedAmount);
          });
        }

        return Promise.resolve({
          ring: totalBalance.minus(vestedAmountRing), // this is the transferable amount
          kton: transferableKTON,
        });
      }

      return Promise.resolve({
        ring: BigNumber(0),
        kton: BigNumber(0),
      });
    },
    [apiPromise]
  );

  useEffect(() => {
    const parseAccounts = async () => {
      if (!apiPromise) {
        setLoadingBalance(false);
        return;
      }
      setLoadingBalance(true);
      const customAccounts: CustomInjectedAccountWithMeta[] = [];

      const accounts = injectedAccountsRef.current;
      for (let i = 0; i < accounts.length; i++) {
        const prettyName = await getPrettyName(accounts[i].address);
        const balance = await getAccountBalance(accounts[i].address);
        customAccounts.push({
          ...accounts[i],
          prettyName,
          balance: balance,
          formattedAddress: convertToSS58(accounts[i].address, selectedNetwork?.prefix ?? 18),
        });
      }

      /* Force adding an address if there is an account address that was set from the URL */
      if (forcedAccountAddress.current) {
        const prettyName = await getPrettyName(forcedAccountAddress.current);
        const balance = await getAccountBalance(forcedAccountAddress.current);
        customAccounts.unshift({
          prettyName,
          balance,
          type: "sr25519",
          address: forcedAccountAddress.current,
          meta: { source: "" },
          formattedAddress: convertToSS58(forcedAccountAddress.current, selectedNetwork?.prefix ?? 18),
        });
      }
      if (customAccounts.length > 0) {
        setSelectedAccount(customAccounts[0]);
      }
      setInjectedAccounts(customAccounts);
      setLoadingBalance(false);
    };

    parseAccounts().catch(() => {
      setLoadingBalance(false);
      //ignore
    });
  }, [injectedAccountsRef.current, apiPromise, selectedNetwork]);

  /*Connect to MetaMask*/
  const connectWallet = useCallback(async (name: SupportedWallet) => {
    if (!selectedNetwork || isRequestingWalletConnection) {
      return;
    }

    const walletCfg = dAppSupportedWallets.find((item) => item.name === name);
    if (!walletCfg) {
      return;
    }

    const injecteds = window.injectedWeb3;
    const source = injecteds && walletCfg.sources.find((source) => injecteds[source]);
    if (!source) {
      setWalletConnected(false);
      setRequestingWalletConnection(false);
      setLoadingTransaction(false);
      setLoadingBalance(false);
      setError({
        code: 1,
        message: "Please Install Polkadot JS Extension",
      });
      return;
    }

    try {
      setWalletConnected(false);
      setRequestingWalletConnection(true);
      const provider = new WsProvider(selectedNetwork.substrate.wssURL);
      const api = new ApiPromise({
        provider,
      });

      api.on("connected", async () => {
        const readyAPI = await api.isReady;
        setApiPromise(readyAPI);
        setRequestingWalletConnection(false);
      });
      api.on("disconnected", () => {
        // console.log("disconnected");
      });
      api.on("error", () => {
        // console.log("error");
      });

      let accounts: InjectedAccountWithMeta[] = [];
      if (isMobile()) {
        const extensions = await web3Enable(DARWINIA_APPS);
        if (extensions.length) {
          setSigner(extensions[0].signer);
          const unfilteredAccounts = await web3Accounts();
          accounts = unfilteredAccounts
            .filter((account) => !account.address.startsWith("0x"));
        }
      } else {
        const wallet = injecteds[source];
        if (!wallet.enable) {
          return;
        }
        const res = await wallet.enable(DARWINIA_APPS);
        if (res) {
          const enabledExtensions = [res];
  
          /* this is the signer that needs to be used when we sign a transaction */
          setSigner(enabledExtensions[0].signer);
          /* this will return a list of all the accounts that are in the Polkadot extension */
          const unfilteredAccounts = await res.accounts.get();
          accounts = unfilteredAccounts
            .filter((account) => !account.address.startsWith("0x"))
            .map(({ address, genesisHash, name, type }) => ({ address, type, meta: { genesisHash, name, source  } }));
        }
      }
      accounts.forEach((account) => {
        keyring.saveAddress(account.address, account.meta);
      });
      injectedAccountsRef.current = accounts;

      if (accounts.length > 0) {
        /* we default using the first account */
        setWalletConnected(true);
      }
      setSelectedWallet(name);
    } catch (e) {
      setWalletConnected(false);
      setRequestingWalletConnection(false);
      setLoadingBalance(false);
      //ignore
    }
  }, [selectedNetwork, isRequestingWalletConnection, apiPromise, getPrettyName]);

  const changeSelectedNetwork = useCallback(
    (network: ChainConfig) => {
      setSelectedNetwork(network);
    },
    [selectedNetwork]
  );

  const forceSetAccountAddress = useCallback((accountAddress: string) => {
    forcedAccountAddress.current = accountAddress;
  }, []);

  const setTransactionStatus = useCallback((isLoading: boolean) => {
    setLoadingTransaction(isLoading);
  }, []);

  const setUserSelectedAccount = useCallback((account: CustomInjectedAccountWithMeta) => {
    setAccountMigratedJustNow(false);
    setSelectedAccount(account);
  }, []);

  const onInitMigration = useCallback(
    async (from: string, to: string, callback: (isSuccessful: boolean) => void) => {
      let unSubscription: UnSubscription;
      try {
        if (!apiPromise || !signer?.signRaw || !specName) {
          return callback(false);
        }

        /*remove a digit from the network name such as pangolin2, etc*/
        const oldChainName = specName.slice(0, -1);

        const message = `I authorize the migration to ${to.toLowerCase()}, an unused address on ${specName}. Sign this message to authorize using the Substrate key associated with the account on ${oldChainName} that you wish to migrate.`;

        const { signature } = await signer.signRaw({
          address: from,
          type: "bytes",
          data: message,
        });

        const extrinsic = await apiPromise.tx.accountMigration.migrate(from, to, signature);

        unSubscription = (await extrinsic.send((result: SubmittableResult) => {
          console.log(result.toHuman());
          if (result.isCompleted && result.isFinalized) {
            setAccountMigratedJustNow(true);
            callback(true);
          }
        })) as unknown as UnSubscription;
      } catch (e) {
        console.log(e);
        callback(false);
      }

      return () => {
        if (unSubscription) {
          unSubscription();
        }
      };
    },
    [apiPromise, signer, specName]
  );

  useEffect(() => {
    if (!apiPromise) {
      return;
    }

    const getSystemInfo = async () => {
      const encodedSystem = apiPromise.consts.system.version as unknown as SpVersionRuntimeVersion;
      const systemInfo = encodedSystem.toJSON() as unknown as SpVersionRuntimeVersion;
      setSpecName(systemInfo.specName);
    };

    getSystemInfo().catch((e) => {
      //ignore
    });
  }, [apiPromise]);

  return (
    <WalletContext.Provider
      value={{
        walletConfig,
        setSelectedAccount: setUserSelectedAccount,
        isLoadingTransaction,
        setTransactionStatus,
        disconnectWallet,
        isWalletConnected,
        isAccountMigratedJustNow,
        selectedAccount,
        injectedAccounts,
        isRequestingWalletConnection,
        connectWallet,
        error,
        changeSelectedNetwork,
        selectedNetwork,
        forceSetAccountAddress,
        onInitMigration,
        isLoadingBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
