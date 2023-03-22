import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { AssetBalance } from "./storage";

export type SupportedWallet = "Polkadot{.js}" | "Talisman" | "SubWallet" | "NovaWallet";
export type SupportedBrowser = "Chrome" | "Firefox" | "Brave" | "Edge" | "Opera";
export type ChainName = "Crab" | "Pangolin" | "Darwinia" | "Pangoro";
import { Struct } from "@polkadot/types";
import { Contract, ContractInterface } from "@ethersproject/contracts";
import { ApiPromise } from "@polkadot/api";
import { AssetDistribution } from "../dist";

export interface Token {
  name?: string;
  address?: string;
  symbol: string;
  decimals: number;
  logo?: string;
}

export interface Substrate {
  wssURL: string;
  httpsURL?: string;
  metadata?: string;
  graphQlURL: string;
}

export interface ContractABI {
  multisig: ContractInterface;
}

export interface ContractAddress {
  multisig: string;
}

export interface ChainConfig {
  name: ChainName; // this name is used to set the chain name in MetaMask, the user will later see this name on Metamask
  displayName: string; // This name is used on the dApp just for the user to see
  chainId: number;
  ring: Token;
  kton: Token;
  prefix: number;
  substrate: Substrate;
  contractInterface: ContractABI;
  contractAddresses: ContractAddress;
}

export interface WalletExtension {
  browser: SupportedBrowser;
  downloadURL: string;
}

export type WalletSource =
  | "polkadot-js"
  | '"polkadot-js"'
  | "talisman"
  | '"talisman"'
  | "subwallet-js"
  | '"subwallet-js"';

export interface WalletConfig {
  name: SupportedWallet;
  logo: string;
  extensions: WalletExtension[];
  sources: WalletSource[];
}

export interface WalletError {
  code: number;
  message: string;
}

export interface CustomInjectedAccountWithMeta extends InjectedAccountWithMeta {
  prettyName: string | undefined;
  balance: AssetBalance;
  formattedAddress: string;
}

export interface WalletCtx {
  isRequestingWalletConnection: boolean;
  isWalletConnected: boolean;
  connectWallet: (id: SupportedWallet) => void;
  disconnectWallet: () => void;
  forceSetAccountAddress: (accountAddress: string) => void;
  setSelectedAccount: (selectedAccount: CustomInjectedAccountWithMeta) => void;
  changeSelectedNetwork: (network: ChainConfig) => void;
  selectedNetwork: ChainConfig | undefined;
  error: WalletError | undefined;
  selectedAccount: CustomInjectedAccountWithMeta | undefined;
  injectedAccounts: CustomInjectedAccountWithMeta[] | undefined;
  setTransactionStatus: (value: boolean) => void;
  isLoadingTransaction: boolean | undefined;
  onInitMigration: (from: string, to: string, callback: (isSuccessful: boolean) => void) => void;
  isAccountMigratedJustNow: boolean | undefined;
  walletConfig: WalletConfig | undefined;
  isLoadingBalance: boolean | undefined;
  isMultisig: boolean | undefined;
  setMultisig: (value: boolean) => void;
  checkDarwiniaOneMultisigAccount: (
    signatories: string[],
    threshold: number,
    name?: string
  ) => Promise<MultisigAccount | undefined>;
  getAccountBalance: (account: string) => Promise<AssetDistribution | undefined>;
  apiPromise: ApiPromise | undefined;
  currentBlock: CurrentBlock | undefined;
  isLoadingMultisigBalance: boolean | undefined;
  setLoadingMultisigBalance: (isLoading: boolean) => void;
  multisigContract: Contract | undefined;
}

export interface SpVersionRuntimeVersion extends Struct {
  specName: string;
}

export interface MultisigAccountMeta {
  who: string[];
  name: string;
  threshold: number;
}

export interface MultisigAccount {
  address: string;
  meta: MultisigAccountMeta;
}

export interface CurrentBlock {
  number: number;
  timestamp: number;
}
