import { ChainConfig } from "@darwinia/app-types";

export function getInitialWalletParamsFromUrlSearch({
  supportedNetworks,
  search,
}: {
  supportedNetworks: ChainConfig[];
  search: string;
}): {
  networkToSelect: ChainConfig | undefined;
  accountToSelect: string | undefined;
} {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  const accountToSelect = params.get("account") ?? undefined;
  const networkParam = params.get("network");

  const defaultNetwork = supportedNetworks[0];
  if (!defaultNetwork) {
    return { networkToSelect: undefined, accountToSelect };
  }

  if (!networkParam) {
    return { networkToSelect: defaultNetwork, accountToSelect };
  }

  const foundNetwork = supportedNetworks.find((item) => item.name.toLowerCase() === networkParam.toLowerCase());
  return { networkToSelect: foundNetwork ?? defaultNetwork, accountToSelect };
}
