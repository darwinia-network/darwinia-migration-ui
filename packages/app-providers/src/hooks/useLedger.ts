import { useCallback, useEffect, useRef, useState } from "react";

import { AssetDistribution, ChainConfig } from "@darwinia/app-types";
import BigNumber from "bignumber.js";
import { ApiPromise } from "@polkadot/api";
import useBlock from "./useBlock";

interface Params {
  apiPromise: ApiPromise | undefined;
  selectedAccount: string | undefined;
  selectedNetwork: ChainConfig | undefined;
  isWalletCaller?: boolean;
}

const useLedger = ({ apiPromise, selectedAccount, selectedNetwork, isWalletCaller = false }: Params) => {
  const [isLoadingLedger, setLoadingLedger] = useState<boolean>(false);
  const [isLoadingMigratedLedger, setLoadingMigratedLedger] = useState<boolean>(false);
  const [isLoadingWalletLedger, setLoadingWalletLedger] = useState<boolean>(false);
  const isInitialLoad = useRef<boolean>(true);
  const isInitialMigratedDataLoad = useRef<boolean>(true);
  /*staking asset distribution*/
  const [stakedAssetDistribution, setStakedAssetDistribution] = useState<AssetDistribution>();
  const [migratedAssetDistribution, setMigratedAssetDistribution] = useState<AssetDistribution>();

  const { currentBlock } = useBlock(apiPromise);

  useEffect(() => {
    if (selectedAccount) {
      setStakedAssetDistribution(undefined);
      setMigratedAssetDistribution(undefined);
      if (!isWalletCaller) {
        isInitialLoad.current = true;
        setLoadingMigratedLedger(true);
        setLoadingLedger(true);
      } else {
        setLoadingWalletLedger(true);
      }
    }
  }, [selectedAccount, selectedNetwork]);

  const getAccountAsset = useCallback(
    async (
      accountId: string,
      parentBlockHash?: string,
      hasReturnOutput = false,
      showLoading = true,
    ): Promise<AssetDistribution | undefined | void> => {
      const isDataAtPoint = typeof parentBlockHash !== "undefined";

      if (!apiPromise || !currentBlock) {
        setLoadingMigratedLedger(false);
        setLoadingLedger(false);
        setLoadingWalletLedger(false);
        return Promise.resolve(undefined);
      }

      // Set loading states appropriately
      if (showLoading) {
        if (isInitialLoad.current && !isDataAtPoint) {
          isInitialLoad.current = false;
          setLoadingLedger(true);
        }

        if (isInitialMigratedDataLoad.current && isDataAtPoint) {
          isInitialMigratedDataLoad.current = false;
          setLoadingMigratedLedger(true);
        }
      }

      setLoadingWalletLedger(true);
      const api = isDataAtPoint ? await apiPromise.at(parentBlockHash ?? "") : apiPromise;

      // Initialize variables for transferable balances and deposits
      let ringTransferable = BigNumber(0);
      let ktonTransferable = BigNumber(0);
      let totalDepositsAmount = BigNumber(0);

      try {
        // Get transferable balance from account info
        const tempAccountInfoOption = await api.query.accountMigration.accounts(accountId);
        const accountInfoOption = tempAccountInfoOption as any;

        if (accountInfoOption.isSome) {
          const unwrappedAccountInfo = accountInfoOption.unwrap();
          const accountInfo = unwrappedAccountInfo.toHuman();
          const balance = accountInfo.data.free.toString().replaceAll(",", "");
          ringTransferable = BigNumber(balance);
        }

        // Get KTON balance if available
        const ktonAccountInfo = await api.query.accountMigration.ktonAccounts(accountId);
        if (ktonAccountInfo && (ktonAccountInfo as any).isSome) {
          const unwrappedKTONAccount = (ktonAccountInfo as any).unwrap();
          const decodedKTONAccount = unwrappedKTONAccount.toHuman();
          const ktonBalanceString = decodedKTONAccount.balance.toString().replaceAll(",", "");
          ktonTransferable = BigNumber(ktonBalanceString);
        }

        // Get deposits info
        const depositsInfo = await api.query.accountMigration.deposits(accountId);
        if (depositsInfo && (depositsInfo as any).isSome) {
          const unwrappedDeposits = (depositsInfo as any).unwrap();
          const depositsData = unwrappedDeposits.toHuman();

          // Calculate total deposits
          if (Array.isArray(depositsData)) {
            depositsData.forEach((item) => {
              const amount = BigNumber(item.value.toString().replaceAll(",", ""));
              totalDepositsAmount = totalDepositsAmount.plus(amount);
            });
          }
        }
      } catch (e) {
        console.error(e);
      }

      // Create asset with actual transferable balances, deposits and zero values for ledger fields
      const asset: AssetDistribution = {
        ring: {
          transferable: ringTransferable,
          deposit: totalDepositsAmount,
          bonded: BigNumber(0),
          unbonded: BigNumber(0),
          unbonding: BigNumber(0),
          vested: BigNumber(0),
        },
        kton: {
          transferable: ktonTransferable,
          bonded: BigNumber(0),
          unbonded: BigNumber(0),
          unbonding: BigNumber(0),
        },
      };

      // Set the appropriate state with the asset
      if (isDataAtPoint) {
        if (!hasReturnOutput) {
          setMigratedAssetDistribution(asset);
        }
      } else {
        if (!hasReturnOutput) {
          setStakedAssetDistribution(asset);
        }
      }

      // Reset loading states
      if (isDataAtPoint) {
        setLoadingMigratedLedger(false);
      } else {
        setLoadingLedger(false);
      }
      setLoadingWalletLedger(false);

      return Promise.resolve(asset);
    },
    [apiPromise, currentBlock],
  );

  useEffect(() => {
    if (selectedAccount) {
      getAccountAsset(selectedAccount);
    }
  }, [apiPromise, selectedAccount]);

  const retrieveMigratedAsset = useCallback(
    (sourceAccountId: string, parentBlockHash: string) => {
      getAccountAsset(sourceAccountId, parentBlockHash);
    },
    [apiPromise, currentBlock],
  );

  return {
    getAccountAsset,
    isLoadingLedger,
    stakedAssetDistribution,
    isLoadingMigratedLedger,
    retrieveMigratedAsset,
    migratedAssetDistribution,
    isLoadingWalletLedger,
  };
};

export default useLedger;
