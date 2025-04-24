import { ApiPromise } from "@polkadot/api";
import { useCallback } from "react";
import { DeriveAccountRegistration } from "@polkadot/api-derive/accounts/types";

import { TypeRegistry } from "@polkadot/types/create";
import { AccountId } from "@polkadot/types/interfaces";
import { stringToU8a } from "@polkadot/util";
import { keyring } from "@polkadot/ui-keyring";

const registry = new TypeRegistry();
const PAD = 32;
const KNOWN: [AccountId, string][] = [
  [registry.createType("AccountId", stringToU8a("modlpy/socie".padEnd(PAD, "\0"))), "Society"],
  [registry.createType("AccountId", stringToU8a("modlpy/trsry".padEnd(PAD, "\0"))), "Treasury"],
];

/*This code needs a double check with Polkadot JS apps */
const useAccountPrettyName = (apiPromise: ApiPromise | undefined) => {
  const extractName = (accountAddress: string, defaultName?: string) => {
    const known = KNOWN.find(([address]) => address.eq(accountAddress));
    if (known) {
      return known[1];
    }

    const accountId = accountAddress.toString();
    if (!accountId) {
      return defaultName;
    }
    const accountMeta = keyring.getAddress(accountAddress);
    return accountMeta?.meta.name ?? defaultName;
  };

  /*Old code from apps.darwinia.network */
  const extractIdentity = (cacheAddress: string, identity: DeriveAccountRegistration) => {
    const judgements = identity.judgements.filter(([, judgement]) => !judgement.isFeePaid);
    const isGood = judgements.some(([, judgement]) => judgement.isKnownGood || judgement.isReasonable);
    // const isBad = judgements.some(([, judgement]) => judgement.isErroneous || judgement.isLowQuality);
    const displayName = isGood ? identity.display : (identity.display || "").replace(/[^\x20-\x7E]/g, "");
    const displayParent =
      identity.displayParent && (isGood ? identity.displayParent : identity.displayParent.replace(/[^\x20-\x7E]/g, ""));
    return displayParent || displayName;
  };

  const getPrettyName = useCallback(
    async (accountAddress: string): Promise<string | undefined> => {
      if (!apiPromise) {
        return Promise.resolve("");
      }

      const queryInfo = async (): Promise<string | undefined> => {
        const accountInfo = await apiPromise.derive.accounts.info(accountAddress);
        const { nickname, identity } = accountInfo;
        if (typeof apiPromise.query.identity?.identityOf === "function") {
          const name = identity.display ? extractIdentity(accountAddress, identity) : extractName(accountAddress);
          return Promise.resolve(name);
        } else if (nickname) {
          return Promise.resolve(nickname);
        }
        const name = extractName(accountAddress);
        return Promise.resolve(name);
      };

      const res = await queryInfo().catch(() => {
        //ignore
      });
      return Promise.resolve(res ? res.toUpperCase() : undefined);
    },
    [apiPromise],
  );

  return {
    getPrettyName,
  };
};

export default useAccountPrettyName;
