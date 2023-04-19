import { ChainConfig } from "@darwinia/app-types";
import multisigContract from "../abi/contract.json";

export const darwinia: ChainConfig = {
  name: "Darwinia",
  displayName: "Darwinia",
  explorerURLs: ["https://darwinia.subscan.io/"],
  httpsURLs: ["https://cors.kahub.in/http://g1.dev.darwinia.network:10000"],
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
    multisig: "0x227c3e01071C2429766dDec2267A613e32DD463e", //TODO  update this accordingly
  },
  contractInterface: {
    multisig: multisigContract,
  },
  chainId: 46,
  prefix: 18,
  substrate: {
    graphQlURL: "https://api.subquery.network/sq/isunaslabs/darwinia2",
    wssURL: "ws://g1.dev.darwinia.network:20000",
  },
};

/*
 * DevNet
 * httpsURLs: ["https://cors.kahub.in/http://g1.dev.darwinia.network:10000"]
 * graphQlURL: "https://api.subquery.network/sq/isunaslabs/darwinia2",
 * wssURL: "ws://g1.dev.darwinia.network:20000",
 *
 * LiveNet
 * httpURLs: ["https://rpc.darwinia.network"]
 * wssURL: "wss://rpc.darwinia.network",
 * graphQlURL: "https://subql.darwinia.network/subql-apps-darwinia/",
 *
 * */
