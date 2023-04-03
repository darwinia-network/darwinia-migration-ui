import { ChainConfig } from "@darwinia/app-types";
import multisigContract from "../abi/contract.json";

export const pangoro: ChainConfig = {
  name: "Pangoro",
  displayName: "Pangoro",
  explorerURLs: ["https://pangoro.subscan.io/"],
  httpsURLs: ["https://pangoro-rpc.darwinia.network"],
  kton: {
    address: "0x0000000000000000000000000000000000000402",
    symbol: "OKTON",
    name: "OKTON",
    decimals: 9,
    ethereumDecimals: 18,
  },
  ring: {
    name: "ORING",
    symbol: "ORING",
    decimals: 9,
    ethereumDecimals: 18,
  },
  contractAddresses: {
    multisig: "0x6c25E0c1f57d7E78d7eB8D350f11204137EF71bE",
  },
  contractInterface: {
    multisig: multisigContract,
  },
  chainId: 45,
  prefix: 18,
  substrate: {
    graphQlURL: "https://api.subquery.network/sq/isunaslabs/pangoro",
    wssURL: "wss://pangoro-rpc.darwinia.network",
  },
};

//graphQlURL: "https://subql.darwinia.network/subql-apps-pangoro",
//wssURL: "wss://pangoro-rpc.darwinia.network",

//dev
//graphQlURL: "https://api.subquery.network/sq/isunaslabs/pangoro-2",
//     wssURL: "ws://g1.dev.darwinia.network:20000",
