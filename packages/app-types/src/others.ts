import { DestinationType, MultisigAccount, SupportedWallet } from "./wallet";

export interface Account {
  id: number;
}

export interface Destination {
  address: string;
  type: DestinationType;
  members: string[];
  threshold: number;
}

export interface DestinationInfo {
  [accountAddress: string]: Destination;
}

export interface Storage {
  isConnectedToWallet?: boolean;
  selectedNetwork?: boolean;
  selectedWallet?: SupportedWallet;
  multisigAccounts?: MultisigAccount[];
  destinationInfo: DestinationInfo;
}
