import { ChainConfig } from "@darwinia/app-types";
import multisigContract from "../abi/contract.json";

export const darwinia: ChainConfig = {
  name: "Darwinia",
  displayName: "Darwinia",
  explorerURLs: ["https://darwinia.subscan.io/"],
  httpsURLs: ["https://rpc.darwinia.network"],
  kton: {
    address: "0x0000000000000000000000000000000000000402",
    symbol: "KTON",
    decimals: 18,
  },
  ring: {
    name: "RING",
    symbol: "RING",
    decimals: 18,
  },
  contractAddresses: {
    multisig: "0x227c3e01071C2429766dDec2267A613e32DD463e", //TODO  update this accordingly
  },
  contractInterface: {
    multisig: multisigContract,
  },
  chainId: 46,
  prefix: 18,
  substrate: {
    graphQlURL: "https://subql.darwinia.network/subql-apps-darwinia/",
    wssURL: "wss://rpc.darwinia.network",
  },
};
