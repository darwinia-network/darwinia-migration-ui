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
  DarwiniaSourceAccountMigrationMultisig,
  MultisigDestinationParams,
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
import { Option } from "@polkadot/types";
import { convertToSS58, setStore, getStore, createMultiSigAccount, convertNumberToHex } from "@darwinia/app-utils";
import useBlock from "./hooks/useBlock";
import useLedger from "./hooks/useLedger";
import { Contract, ethers } from "ethers";
import { HexString } from "@polkadot/util/types";
import { Codec } from "@polkadot/types/types";
import { Web3Provider } from "@ethersproject/providers";

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
  multisigContract: undefined,
  selectedEthereumAccount: undefined,
  ethereumError: undefined,
  isCorrectEthereumChain: undefined,
  multisigMigrationStatus: undefined,
  isMultisigAccountMigratedJustNow: undefined,
  isCheckingMultisigCompleted: undefined,
  setLoadingMultisigBalance: (isLoading: boolean) => {
    //ignore
  },
  changeSelectedNetwork: () => {
    // do nothing
  },
  connectWallet: () => {
    //do nothing
  },
  connectEthereumWallet: () => {
    //ignore
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
  checkDarwiniaOneMultisigAccount: (initializer: string, signatories: string[], threshold: number, name?: string) => {
    return Promise.resolve(undefined);
  },
  getAccountBalance: (account: string) => {
    return Promise.resolve(undefined);
  },
  checkMultisigAccountMigrationStatus: (account: string) => {
    return Promise.resolve(undefined);
  },
  getAccountPrettyName: () => {
    return Promise.resolve(undefined);
  },
  onInitMultisigMigration: (
    to: string,
    signerAddress: string,
    initializer: string,
    otherAccounts: string[],
    threshold: string,
    multisigDestinationParams: MultisigDestinationParams | null,
    callback: (isSuccessful: boolean) => void,
  ) => {
    //ignore
  },
  onApproveMultisigMigration: (
    from: string,
    to: string,
    signerAddress: string,
    callback: (isSuccessful: boolean) => void,
  ) => {
    //ignore
  },
  isMultisigAccountDeployed: (accountAddress: string) => {
    return Promise.resolve(false);
  },
  setIsCheckingMultisigCompleted: (isLoading: boolean) => {
    //ignore
  },
};

const WalletContext = createContext<WalletCtx>(initialState);

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [signer, setSigner] = useState<Signer>();
  const [isRequestingWalletConnection, setRequestingWalletConnection] = useState<boolean>(false);
  const [isWalletConnected, setWalletConnected] = useState(false);
  const [isRequestingEthereumWalletConnection, setRequestingEthereumWalletConnection] = useState<boolean>(false);
  const [isEthereumWalletConnected, setEthereumWalletConnected] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CustomInjectedAccountWithMeta>();
  const [injectedAccounts, setInjectedAccounts] = useState<CustomInjectedAccountWithMeta[]>();
  const [selectedEthereumAccount, setSelectedEthereumAccount] = useState<string>();
  const injectedAccountsRef = useRef<InjectedAccountWithMeta[]>([]);
  const forcedAccountAddress = useRef<string>();
  const [error, setError] = useState<WalletError | undefined>(undefined);
  const [ethereumError, setEthereumError] = useState<WalletError | undefined>(undefined);
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
  const [isMultisigAccountMigratedJustNow, setMultisigAccountMigratedJustNow] = useState<boolean>(false);
  const [specName, setSpecName] = useState<string>();
  const [isMultisig, setMultisig] = useState<boolean>(false);
  const [isLoadingMultisigBalance, setLoadingMultisigBalance] = useState<boolean>(false);
  const [selectedWallet, _setSelectedWallet] = useState<SupportedWallet | null | undefined>();
  const [multisigContract, setMultisigContract] = useState<Contract>();
  const [provider, setProvider] = useState<Web3Provider>();
  const [isCorrectEthereumChain, setCorrectEthereumChain] = useState<boolean>(false);
  const [multisigMigrationStatus, setMultisigMigrationStatus] = useState<DarwiniaSourceAccountMigrationMultisig>();
  const [isCheckingMultisigCompleted, setIsCheckingMultisigCompleted] = useState<boolean>(false);
  const [selectedChainId, setSelectedChainId] = useState();

  const { currentBlock } = useBlock(apiPromise);
  const { getAccountAsset, isLoadingWalletLedger } = useLedger({
    apiPromise,
    selectedAccount: selectedAccount?.formattedAddress,
    selectedNetwork,
    isWalletCaller: true,
  });

  useEffect(() => {
    setLoadingMultisigBalance(isLoadingWalletLedger);
  }, [isLoadingWalletLedger]);

  const setSelectedWallet = useCallback((name: SupportedWallet | null | undefined) => {
    _setSelectedWallet(name);
    setStore("selectedWallet", name);
  }, []);

  // Force set test account for local development
  useEffect(() => {
    // Only run in development environment
    if (process.env.NODE_ENV === "development" && isWalletConnected && injectedAccounts?.length) {
      const testAccountAddress = "2sq4rdopkTNRrB36fw6yzqpjJktjvFQt2CVYfTkQevUq65od";

      // Force set the account
      forcedAccountAddress.current = testAccountAddress;
      console.log("Development mode: Force setting test account to:", testAccountAddress);

      // Find if the account already exists in injected accounts
      const existingAccount = injectedAccounts.find((acc) => acc.formattedAddress === testAccountAddress);

      if (existingAccount) {
        // If it exists, select it
        setSelectedAccount(existingAccount);
        console.log("Found and selected existing account:", existingAccount);
      } else {
        // Otherwise trigger a reload of the accounts to include the forced account
        isInitialLoadingBalance.current = true;
        // This will cause the useEffect that loads account balances to run again
        setLoadingBalance(true);
        console.log("Account not found in injected accounts, triggering reload");
      }
    }
  }, [isWalletConnected, injectedAccounts]);

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

  /*This will be fired once the connection to the wallet is successful*/
  useEffect(() => {
    if (!selectedNetwork || !isEthereumWalletInstalled()) {
      return;
    }
    //refresh the page with the newly selected account
    const newProvider = new ethers.providers.Web3Provider(window.ethereum);
    const newSigner = newProvider.getSigner();
    const multisigContract = new ethers.Contract(
      selectedNetwork.contractAddresses.multisig,
      selectedNetwork.contractInterface.multisig,
      newSigner,
    );
    setProvider(newProvider);
    setMultisigContract(multisigContract);
  }, [selectedNetwork, isEthereumWalletConnected]);

  const disconnectWallet = useCallback(() => {
    setSelectedAccount(undefined);
    setWalletConnected(false);
  }, []);

  const getAccountBalance = useCallback(
    async (accountAddress: string): Promise<AssetDistribution> => {
      if (!apiPromise || !currentBlock) {
        return Promise.resolve({
          ring: {
            transferable: BigNumber(0),
            deposit: BigNumber(0),
            bonded: BigNumber(0),
            unbonded: BigNumber(0),
            unbonding: BigNumber(0),
            vested: BigNumber(0),
          },
          kton: {
            transferable: BigNumber(0),
            bonded: BigNumber(0),
            unbonded: BigNumber(0),
            unbonding: BigNumber(0),
          },
        });
      }
      const asset = await getAccountAsset(accountAddress, undefined, true, false);
      if (!asset) {
        return Promise.resolve({
          ring: {
            transferable: BigNumber(0),
            deposit: BigNumber(0),
            bonded: BigNumber(0),
            unbonded: BigNumber(0),
            unbonding: BigNumber(0),
            vested: BigNumber(0),
          },
          kton: {
            transferable: BigNumber(0),
            bonded: BigNumber(0),
            unbonded: BigNumber(0),
            unbonding: BigNumber(0),
          },
        });
      }

      return Promise.resolve({
        ...asset,
      });
    },
    [apiPromise, currentBlock],
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
      if (customAccounts.length > 0 && !isMultisig) {
        setSelectedAccount(customAccounts[0]);
      }
      setInjectedAccounts(customAccounts);
      setLoadingBalance(false);
    };

    parseAccounts().catch((err) => {
      console.error(err);
      setLoadingBalance(false);
      //ignore
    });
  }, [injectedAccountsRef.current, apiPromise, selectedNetwork, isMultisig, currentBlock]);

  /*Connect to Polkadot*/
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
      if (!source && name !== "NovaWallet") {
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
        if (name === "NovaWallet") {
          const extensions = await web3Enable(DARWINIA_APPS);
          if (extensions.length) {
            setSigner(extensions[0].signer);
            const unfilteredAccounts = await web3Accounts();
            accounts = unfilteredAccounts.filter((account) => !account.address.startsWith("0x"));
          }
        } else if (source) {
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
              .map(({ address, genesisHash, name, type }) => ({ address, type, meta: { genesisHash, name, source } }));
          }
        }

        accounts.forEach((account) => {
          keyring.saveAddress(convertToSS58(account.address, selectedNetwork.prefix), account.meta);
        });
        injectedAccountsRef.current = accounts;

        if (accounts.length > 0) {
          /* we default using the first account */
          setWalletConnected(true);
        }
        setSelectedWallet(name);
      } catch (e) {
        console.error(e);
        setWalletConnected(false);
        setRequestingWalletConnection(false);
        setLoadingBalance(false);
        //ignore
      }
    },
    [selectedNetwork, isRequestingWalletConnection, apiPromise, getPrettyName],
  );

  const isEthereumWalletInstalled = () => {
    return !!window.ethereum;
  };

  const getAccountPrettyName = useCallback(
    (address: string): Promise<string | undefined> => {
      return getPrettyName(address);
    },
    [apiPromise],
  );

  /* Listen to metamask account changes */
  useEffect(() => {
    if (!isEthereumWalletInstalled() || !isEthereumWalletConnected || !selectedNetwork) {
      setSelectedEthereumAccount(undefined);
      return;
    }

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        const account = accounts[0];
        setSelectedEthereumAccount(account);
      }
    };

    const onChainChanged = (chainId: HexString) => {
      setCorrectEthereumChain(true);
      const selectedNetworkChainId = convertNumberToHex(selectedNetwork?.chainId);
      setCorrectEthereumChain(chainId === selectedNetworkChainId);
      /*Metamask recommends reloading the whole page ref: https://docs.metamask.io/guide/ethereum-provider.html#events */
      window.location.reload();
    };

    window.ethereum?.on<string[]>("accountsChanged", onAccountsChanged);
    window.ethereum?.on("chainChanged", onChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener("chainChanged", onChainChanged);
    };
  }, [isEthereumWalletConnected, selectedNetwork]);

  /*Connect to Ethereum wallet*/
  const connectEthereumWallet = useCallback(async () => {
    if (!selectedNetwork || isRequestingEthereumWalletConnection) {
      return;
    }
    try {
      setEthereumWalletConnected(false);
      if (!isEthereumWalletInstalled()) {
        setEthereumError({
          code: 0,
          message: "Wallet is not installed",
        });
        setEthereumWalletConnected(false);
        return;
      }

      setRequestingEthereumWalletConnection(true);
      //try switching the token to the selected network token
      const chainResponse = await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.utils.hexlify(selectedNetwork.chainId) }],
      });
      if (!chainResponse) {
        setCorrectEthereumChain(true);
        //The chain was switched successfully, request account permission
        // request account permission
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          if (accounts && Array.isArray(accounts) && accounts.length > 0) {
            const account = accounts[0];
            setSelectedEthereumAccount(account);
            setRequestingEthereumWalletConnection(false);
            setEthereumWalletConnected(true);
          }
        } catch (e) {
          console.log(e);
          setRequestingEthereumWalletConnection(false);
          setEthereumWalletConnected(false);
          setEthereumError({
            code: 4,
            message: "Account access permission rejected",
          });
        }
      }
    } catch (e) {
      if ((e as { code: number }).code === 4902) {
        /*Unrecognized chain, add it first*/
        try {
          const addedChainResponse = await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ethers.utils.hexlify(selectedNetwork.chainId),
                chainName: selectedNetwork.name,
                nativeCurrency: {
                  ...selectedNetwork.ring,
                  decimals: selectedNetwork.ring.ethereumDecimals,
                },
                rpcUrls: [...selectedNetwork.httpsURLs],
                blockExplorerUrls: [...selectedNetwork.explorerURLs],
              },
            ],
          });
          if (!addedChainResponse) {
            // request account permission
            try {
              const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
              });
              if (accounts && Array.isArray(accounts) && accounts.length > 0) {
                const account = accounts[0];
                setSelectedEthereumAccount(account);
                setRequestingEthereumWalletConnection(false);
                setEthereumWalletConnected(true);
              }
            } catch (e) {
              setRequestingEthereumWalletConnection(false);
              setEthereumError({
                code: 4,
                message: "Account access permission rejected",
              });
              setEthereumWalletConnected(false);
            }
          }
        } catch (e) {
          setEthereumError({
            code: 1,
            message: "User rejected adding ethereum chain",
          });
          setRequestingEthereumWalletConnection(false);
          setEthereumWalletConnected(false);
        }
        return;
      }
      setRequestingEthereumWalletConnection(false);
      setEthereumWalletConnected(false);
      setEthereumError({
        code: 1,
        message: "User rejected adding ethereum chain",
      });
    }
  }, [isEthereumWalletInstalled, selectedNetwork, isRequestingEthereumWalletConnection]);

  const changeSelectedNetwork = useCallback(
    (network: ChainConfig) => {
      setSelectedNetwork(network);
    },
    [selectedNetwork],
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
    [apiPromise, signer, specName],
  );

  const onInitMultisigMigration = useCallback(
    async (
      to: string,
      signerAddress: string,
      initializer: string,
      otherAccounts: string[],
      threshold: string,
      multisigDestinationParams: MultisigDestinationParams | null,
      callback: (isSuccessful: boolean) => void,
    ) => {
      let unSubscription: UnSubscription;
      try {
        if (!apiPromise || !signer?.signRaw || !specName) {
          return callback(false);
        }
        setMultisigAccountMigratedJustNow(false);

        /*remove a digit from the network name such as pangolin2, etc*/
        const oldChainName = specName.slice(0, -1);

        const message = `I authorize the migration to ${to.toLowerCase()}, an unused address on ${specName}. Sign this message to authorize using the Substrate key associated with the account on ${oldChainName} that you wish to migrate.`;
        const { signature } = await signer.signRaw({
          address: signerAddress,
          type: "bytes",
          data: message,
        });

        const extrinsic = await apiPromise.tx.accountMigration.migrateMultisig(
          initializer,
          otherAccounts,
          threshold,
          to,
          signature,
          multisigDestinationParams,
        );

        unSubscription = (await extrinsic.send((result: SubmittableResult) => {
          console.log(result.toHuman());
          if (result.isCompleted && result.isFinalized) {
            setMultisigAccountMigratedJustNow(true);
            callback(true);
          }
        })) as unknown as UnSubscription;
      } catch (e) {
        setMultisigAccountMigratedJustNow(false);
        console.log(e);
        callback(false);
      }

      return () => {
        if (unSubscription) {
          unSubscription();
        }
      };
    },
    [apiPromise, signer, specName],
  );

  const onApproveMultisigMigration = useCallback(
    async (from: string, to: string, signerAddress: string, callback: (isSuccessful: boolean) => void) => {
      let unSubscription: UnSubscription;
      try {
        if (!apiPromise || !signer?.signRaw || !specName) {
          return callback(false);
        }
        setMultisigAccountMigratedJustNow(false);

        /*remove a digit from the network name such as pangolin2, etc*/
        const oldChainName = specName.slice(0, -1);

        const message = `I authorize the migration to ${to.toLowerCase()}, an unused address on ${specName}. Sign this message to authorize using the Substrate key associated with the account on ${oldChainName} that you wish to migrate.`;
        const { signature } = await signer.signRaw({
          address: signerAddress,
          type: "bytes",
          data: message,
        });
        console.log("to=====", to);
        console.log("signerAddress=====", signerAddress);

        const extrinsic = await apiPromise.tx.accountMigration.completeMultisigMigration(
          from,
          signerAddress,
          signature,
        );

        unSubscription = (await extrinsic.send((result: SubmittableResult) => {
          console.log(result.toHuman());
          if (result.isCompleted && result.isFinalized) {
            setMultisigAccountMigratedJustNow(true);
            callback(true);
          }
        })) as unknown as UnSubscription;
      } catch (e) {
        setMultisigAccountMigratedJustNow(false);
        console.log(e);
        callback(false);
      }

      return () => {
        if (unSubscription) {
          unSubscription();
        }
      };
    },
    [apiPromise, signer, specName],
  );

  const checkMultisigAccountMigrationStatus = useCallback(
    async (accountAddress: string): Promise<undefined | DarwiniaSourceAccountMigrationMultisig> => {
      if (!apiPromise) {
        setMultisigMigrationStatus(undefined);
        return Promise.resolve(undefined);
      }

      const result = (await apiPromise.query.accountMigration.multisigs(accountAddress)) as unknown as Option<Codec>;
      if (!result.isSome) {
        setMultisigMigrationStatus(undefined);
        return Promise.resolve(undefined);
      }
      const resultString = result.unwrap().toHuman();
      const resultObj = resultString as unknown as DarwiniaSourceAccountMigrationMultisig;
      resultObj.threshold = Number(resultObj.threshold);
      setMultisigMigrationStatus(resultObj);
      return Promise.resolve(resultObj);
    },
    [apiPromise],
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
    async (initializer: string, signatories: string[], threshold: number, name?: string) => {
      if (!apiPromise || !selectedNetwork) {
        return Promise.resolve(undefined);
      }

      const newAccount = createMultiSigAccount(signatories, selectedNetwork.prefix, threshold);
      console.log("signatories=====", signatories);
      console.log("newAccount=====", newAccount);
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
          initializer,
        },
      };

      return Promise.resolve(account);
    },
    [apiPromise, selectedNetwork],
  );

  const isMultisigAccountDeployed = useCallback(
    async (accountAddress: string): Promise<boolean> => {
      const result = await provider?.getCode(accountAddress);
      return result !== "0x";
    },
    [provider],
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
        multisigContract,
        onInitMultisigMigration,
        onApproveMultisigMigration,
        connectEthereumWallet,
        ethereumError,
        selectedEthereumAccount,
        isCorrectEthereumChain,
        checkMultisigAccountMigrationStatus,
        multisigMigrationStatus,
        getAccountPrettyName,
        isMultisigAccountMigratedJustNow,
        isMultisigAccountDeployed,
        isCheckingMultisigCompleted,
        setIsCheckingMultisigCompleted,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
