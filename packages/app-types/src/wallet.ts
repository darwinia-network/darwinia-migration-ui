import { ContractInterface } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { Signer } from "@polkadot/api/types";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { AssetBalance } from "./storage";

export type SupportedWallet = "MetaMask";
export type SupportedBrowser = "Chrome" | "Firefox" | "Brave" | "Edge" | "Opera";
export type ChainName = "Crab" | "Pangolin" | "Darwinia" | "Pangoro";

export interface Token {
  name?: string;
  address?: string;
  symbol: string;
  decimals: number;
  logo?: string;
}

export interface ContractAddress {
  staking: string;
  deposit: string;
}

export interface ContractABI {
  staking: ContractInterface;
  deposit: ContractInterface;
}

export interface Substrate {
  wssURL: string;
  httpsURL: string;
  metadata?: string;
  graphQlURL: string;
}

export interface ChainConfig {
  name: ChainName; // this name is used to set the chain name in MetaMask, the user will later see this name on Metamask
  displayName: string; // This name is used on the dApp just for the user to see
  chainId: number;
  ring: Token;
  kton: Token;
  httpsURLs: string[];
  explorerURLs: string[];
  contractInterface: ContractABI;
  contractAddresses: ContractAddress;
  substrate: Substrate;
}

export interface WalletExtension {
  browser: SupportedBrowser;
  downloadURL: string;
}

export interface WalletConfig {
  name: SupportedWallet;
  logo: string;
  extensions: WalletExtension[];
}

export interface WalletError {
  code: number;
  message: string;
}

export interface CustomInjectedAccountWithMeta extends InjectedAccountWithMeta {
  prettyName: string | undefined;
  balance: AssetBalance;
}

export interface WalletCtx {
  provider: Web3Provider | undefined;
  signer: Signer | undefined;
  depositContract: Contract | undefined;
  stakingContract: Contract | undefined;
  isRequestingWalletConnection: boolean;
  isWalletConnected: boolean;
  connectWallet: () => void;
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
}
