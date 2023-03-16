import { ChainConfig } from "@darwinia/app-types";
import multisigContract from "../abi/contract.json";

export const pangoro: ChainConfig = {
  name: "Pangoro",
  displayName: "Pangoro",
  kton: {
    address: "0x0000000000000000000000000000000000000402",
    symbol: "OKTON",
    name: "OKTON",
    decimals: 9,
  },
  ring: {
    name: "ORING",
    symbol: "ORING",
    decimals: 9,
  },
  contractAddresses: {
    multisig: "0xF09FE18d3f4b4345b47c098C8B8Fba7743418aA4",
  },
  contractInterface: {
    multisig: multisigContract,
  },
  chainId: 45,
  prefix: 18,
  substrate: {
    graphQlURL: "https://subql.darwinia.network/subql-apps-pangoro",
    wssURL: "wss://pangoro-rpc.darwinia.network",
  },
};

//graphQlURL: "https://subql.darwinia.network/subql-apps-pangoro",
//wssURL: "wss://pangoro-rpc.darwinia.network",

//dev
//graphQlURL: "https://api.subquery.network/sq/isunaslabs/pangoro-2",
//     wssURL: "ws://g1.dev.darwinia.network:20000",
