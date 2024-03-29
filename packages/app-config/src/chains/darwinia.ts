import { ChainConfig } from "@darwinia/app-types";
import multisigContract from "../abi/darwiniaContract.json";

export const darwinia: ChainConfig = {
  name: "Darwinia",
  displayName: "Darwinia",
  explorerURLs: ["https://darwinia.subscan.io/"],
  httpsURLs: ["https://rpc.darwinia.network"],
  kton: {
    address: "0x0000000000000000000000000000000000000402",
    symbol: "KTON",
    decimals: 9,
    ethereumDecimals: 18,
  },
  ring: {
    name: "RING",
    symbol: "RING",
    decimals: 9,
    ethereumDecimals: 18,
  },
  contractAddresses: {
    multisig: "0xEE62B94230F6F8834Fb1E73152C7348e54d60521",
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

/*
 * DevNet
 * httpsURLs: ["https://cors.zimjs.com/http://g1.dev.darwinia.network:10000"]
 * graphQlURL: "https://api.subquery.network/sq/isunaslabs/darwinia2",
 * wssURL: "ws://g1.dev.darwinia.network:20000",
 *
 * LiveNet
 * httpURLs: ["https://rpc.darwinia.network"]
 * wssURL: "wss://rpc.darwinia.network",
 * graphQlURL: "https://subql.darwinia.network/subql-apps-darwinia/",
 *
 * */
