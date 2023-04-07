import { ChainConfig } from "@darwinia/app-types";
import multisigContract from "../abi/contract.json";

export const pangolin: ChainConfig = {
  name: "Pangolin",
  displayName: "Pangolin",
  explorerURLs: ["https://pangolin.subscan.io/"],
  httpsURLs: ["https://pangolin-rpc.darwinia.network"],
  kton: {
    address: "0x0000000000000000000000000000000000000402",
    symbol: "PKTON",
    decimals: 9,
    ethereumDecimals: 18,
  },
  ring: {
    name: "PRING",
    symbol: "PRING",
    decimals: 9,
    ethereumDecimals: 18,
  },
  contractAddresses: {
    multisig: "0x227c3e01071C2429766dDec2267A613e32DD463e",
  },
  contractInterface: {
    multisig: multisigContract,
  },
  chainId: 43,
  prefix: 42,
  substrate: {
    graphQlURL: "https://subql.darwinia.network/subql-apps-pangolin",
    wssURL: "wss://pangolin-rpc.darwinia.network/",
  },
};
