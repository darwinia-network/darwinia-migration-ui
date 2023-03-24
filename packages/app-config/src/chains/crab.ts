import { ChainConfig } from "@darwinia/app-types";
import multisigContract from "../abi/contract.json";

export const crab: ChainConfig = {
  name: "Crab",
  displayName: "Crab",
  explorerURLs: ["https://crab.subscan.io/"],
  httpsURLs: ["https://crab-rpc.darwinia.network"],
  kton: {
    address: "0x0000000000000000000000000000000000000402",
    symbol: "CKTON",
    decimals: 9,
  },
  ring: {
    name: "CRAB",
    symbol: "CRAB",
    decimals: 9,
  },
  contractAddresses: {
    multisig: "0x227c3e01071C2429766dDec2267A613e32DD463e",
  },
  contractInterface: {
    multisig: multisigContract,
  },
  chainId: 44,
  prefix: 42,
  substrate: {
    graphQlURL: "https://subql.darwinia.network/subql-apps-crab/",
    wssURL: "wss://crab-rpc.darwinia.network",
  },
};
