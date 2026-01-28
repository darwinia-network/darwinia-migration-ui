import { describe, expect, it } from "vitest";
import { ChainConfig } from "@darwinia/app-types";
import { getInitialWalletParamsFromUrlSearch } from "../getInitialWalletParamsFromUrlSearch";

const makeChain = (name: ChainConfig["name"]) => ({ name } as unknown as ChainConfig);

describe("getInitialWalletParamsFromUrlSearch", () => {
  it("falls back to default network when query has unsupported network", () => {
    const networks = [makeChain("Darwinia"), makeChain("Pangolin")];

    const { networkToSelect } = getInitialWalletParamsFromUrlSearch({
      supportedNetworks: networks,
      search: "?network=Crab",
    });

    expect(networkToSelect).toBe(networks[0]);
  });

  it("falls back to default network when query has no network param", () => {
    const networks = [makeChain("Darwinia"), makeChain("Pangolin")];

    const { networkToSelect } = getInitialWalletParamsFromUrlSearch({
      supportedNetworks: networks,
      search: "?account=5abc",
    });

    expect(networkToSelect).toBe(networks[0]);
  });

  it("selects the matching network when query has a supported network", () => {
    const networks = [makeChain("Darwinia"), makeChain("Pangolin")];

    const { networkToSelect } = getInitialWalletParamsFromUrlSearch({
      supportedNetworks: networks,
      search: "?network=pangolin",
    });

    expect(networkToSelect).toBe(networks[1]);
  });

  it("returns undefined network when there are no supported networks", () => {
    const { networkToSelect } = getInitialWalletParamsFromUrlSearch({
      supportedNetworks: [],
      search: "?network=Darwinia",
    });

    expect(networkToSelect).toBeUndefined();
  });
});

