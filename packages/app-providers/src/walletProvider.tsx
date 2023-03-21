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
  MultisigAccount,
  DarwiniaStakingLedgerEncoded,
  DepositEncoded,
  Deposit,
  DarwiniaStakingLedger,
  AssetDistribution,
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
import { convertToSS58, setStore, getStore, createMultiSigAccount } from "@darwinia/app-utils";
import useBlock from "./hooks/useBlock";
import useLedger from "./hooks/useLedger";

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
  isMultisig: undefined,
  isLoadingBalance: undefined,
  apiPromise: undefined,
  currentBlock: undefined,
  isLoadingMultisigBalance: undefined,
  setLoadingMultisigBalance: (isLoading: boolean) => {},
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
  setMultisig: (value: boolean) => {
    //ignore
  },
  checkDarwiniaOneMultisigAccount: (signatories: string[], threshold: number, name?: string) => {
    return Promise.resolve(undefined);
  },
  getAccountBalance: (account: string) => {
    return Promise.resolve({
      ring: BigNumber(0),
      kton: BigNumber(0),
    });
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
  const isInitialLoadingBalance = useRef<boolean>(true);
  const [apiPromise, setApiPromise] = useState<ApiPromise>();
  const { getPrettyName } = useAccountPrettyName(apiPromise);
  const DARWINIA_APPS = "darwinia/apps";
  const isKeyringInitialized = useRef<boolean>(false);
  const [isAccountMigratedJustNow, setAccountMigratedJustNow] = useState<boolean>(false);
  const [specName, setSpecName] = useState<string>();
  const [isMultisig, setMultisig] = useState<boolean>(false);
  const [isLoadingMultisigBalance, setLoadingMultisigBalance] = useState<boolean>(false);
  const [selectedWallet, _setSelectedWallet] = useState<SupportedWallet | null | undefined>();

  const { currentBlock } = useBlock(apiPromise);
  const { getAccountAsset } = useLedger({
    apiPromise,
    selectedAccount: selectedAccount?.formattedAddress,
    selectedNetwork,
  });

  const setSelectedWallet = useCallback((name: SupportedWallet | null | undefined) => {
    _setSelectedWallet(name);
    setStore("selectedWallet", name);
  }, []);

  useEffect(() => {
    _setSelectedWallet(getStore("selectedWallet"));
  }, []);

  //makes sure that the loading spinner shows once the wallet is connected
  useEffect(() => {
    setLoadingBalance(isWalletConnected);
  }, [isWalletConnected]);

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
      if (!apiPromise || !currentBlock) {
        return Promise.resolve({
          ring: BigNumber(0),
          kton: BigNumber(0),
        });
      }
      const asset = await getAccountAsset(accountAddress, undefined, true, false);
      return Promise.resolve({
        ring: asset?.ring.transferable ?? BigNumber(0),
        kton: asset?.kton.transferable ?? BigNumber(0),
      });
    },
    [apiPromise, currentBlock]
  );

  useEffect(() => {
    const parseAccounts = async () => {
      if (!apiPromise || !currentBlock || !isInitialLoadingBalance.current) {
        // this makes sure that the balance is queried only once
        return;
      }
      if (isInitialLoadingBalance.current) {
        isInitialLoadingBalance.current = false;
      }
      setLoadingBalance(true);
      const customAccounts: CustomInjectedAccountWithMeta[] = [];

      const accounts = injectedAccountsRef.current;
      for (let i = 0; i < accounts.length; i++) {
        const prettyName = isMultisig ? "" : await getPrettyName(accounts[i].address);
        const formattedAddress = convertToSS58(accounts[i].address, selectedNetwork?.prefix ?? 18);
        /* set all the injected accounts balance to zero if we are in the multisig account mode
         * since these accounts won't be shown to the user */

        const defaultAsset = {
          ring: BigNumber(0),
          kton: BigNumber(0),
        };
        const balance = isMultisig
          ? {
              ...defaultAsset,
            }
          : await getAccountAsset(formattedAddress, undefined, true, false);
        const normalAccountAsset = balance as AssetDistribution;
        customAccounts.push({
          ...accounts[i],
          prettyName,
          balance: isMultisig
            ? { ...defaultAsset }
            : { ring: normalAccountAsset.ring.transferable, kton: normalAccountAsset.kton.transferable },
          formattedAddress: formattedAddress,
        });
      }

      /* Force adding an address if there is an account address that was set from the URL */
      if (forcedAccountAddress.current) {
        const prettyName = await getPrettyName(forcedAccountAddress.current);
        const balance = await getAccountAsset(forcedAccountAddress.current);
        customAccounts.unshift({
          prettyName,
          balance: {
            ring: balance?.ring.transferable ?? BigNumber(0),
            kton: balance?.kton.transferable ?? BigNumber(0),
          },
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
  }, [injectedAccountsRef.current, apiPromise, selectedNetwork, isMultisig, currentBlock]);

  /*Connect to MetaMask*/
  const connectWallet = useCallback(
    async (name: SupportedWallet) => {
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
          const accounts = unfilteredAccounts
            .filter((account) => !account.address.startsWith("0x"))
            .map(({ address, genesisHash, name, type }) => ({ address, type, meta: { genesisHash, name, source } }));
          accounts.forEach((account) => {
            keyring.saveAddress(account.address, account.meta);
          });
          injectedAccountsRef.current = accounts;

          if (accounts.length > 0) {
            /* we default using the first account */
            setWalletConnected(true);
          }
          setSelectedWallet(name);
        }
      } catch (e) {
        setWalletConnected(false);
        setRequestingWalletConnection(false);
        setLoadingBalance(false);
        //ignore
      }
    },
    [selectedNetwork, isRequestingWalletConnection, apiPromise, getPrettyName]
  );

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

  const checkDarwiniaOneMultisigAccount = useCallback(
    async (signatories: string[], threshold: number, name?: string) => {
      if (!apiPromise || !selectedNetwork) {
        return Promise.resolve(undefined);
      }

      const newAccount = createMultiSigAccount(signatories, selectedNetwork.prefix, threshold);
      //check if the account really exists
      const response = await apiPromise.query.accountMigration.accounts(newAccount);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const accountInfo = response as unknown as Option<FrameSystemAccountInfo>;
      if (!accountInfo || !accountInfo.isSome) {
        // the account doesn't exist on the chain
        return Promise.resolve(undefined);
      }

      // the account exists on the chain
      const account: MultisigAccount = {
        address: newAccount,
        meta: {
          name: name ?? "",
          who: [...signatories],
          threshold,
        },
      };

      return Promise.resolve(account);
    },
    [apiPromise, selectedNetwork]
  );

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
        isMultisig,
        setMultisig,
        checkDarwiniaOneMultisigAccount,
        isLoadingBalance,
        getAccountBalance,
        apiPromise,
        currentBlock,
        isLoadingMultisigBalance,
        setLoadingMultisigBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
