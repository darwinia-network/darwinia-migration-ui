import { useCallback, useEffect, useRef, useState } from "react";

import {
  AssetDistribution,
  DarwiniaStakingLedgerEncoded,
  DarwiniaStakingLedger,
  Deposit,
  DepositEncoded,
  PalletVestingVestingInfo,
  DarwiniaAccountMigrationAssetAccount,
  ChainConfig,
} from "@darwinia/app-types";
import BigNumber from "bignumber.js";
import { ApiPromise } from "@polkadot/api";
import { UnSubscription } from "../storageProvider";
import useBlock from "./useBlock";
import { Vec, Option, u128, Struct } from "@polkadot/types";
import { FrameSystemAccountInfo } from "@darwinia/api-derive/accounts/types";

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
      showLoading = true
    ): Promise<AssetDistribution | undefined | void> => {
      const isDataAtPoint = typeof parentBlockHash !== "undefined";

      const getStakingLedgerAndDeposits = async (): Promise<AssetDistribution | undefined> => {
        if (!apiPromise || !currentBlock) {
          setLoadingMigratedLedger(false);
          setLoadingLedger(false);
          return Promise.resolve(undefined);
        }

        setLoadingWalletLedger(true);
        const api = isDataAtPoint ? await apiPromise.at(parentBlockHash ?? "") : apiPromise;

        if (showLoading) {
          if (isInitialLoad.current && !isDataAtPoint) {
            isInitialLoad.current = false;
            setLoadingLedger(true);
          } else {
            setLoadingLedger(false);
          }
        }

        if (showLoading) {
          if (isInitialMigratedDataLoad.current && isDataAtPoint) {
            isInitialMigratedDataLoad.current = false;
            setLoadingMigratedLedger(true);
          } else {
            setLoadingMigratedLedger(false);
          }
        }

        let ktonBalance = BigNumber(0);
        const ktonAccountInfo: Option<DarwiniaAccountMigrationAssetAccount> =
          (await api.query.accountMigration.ktonAccounts(
            accountId
          )) as unknown as Option<DarwiniaAccountMigrationAssetAccount>;
        if (ktonAccountInfo.isSome) {
          const unwrappedKTONAccount = ktonAccountInfo.unwrap();
          const decodedKTONAccount = unwrappedKTONAccount.toHuman() as unknown as DarwiniaAccountMigrationAssetAccount;
          const ktonBalanceString = decodedKTONAccount.balance.toString().replaceAll(",", "");
          ktonBalance = BigNumber(ktonBalanceString);
        }

        const ledgerInfo: Option<DarwiniaStakingLedgerEncoded> = (await api.query.accountMigration.ledgers(
          accountId
        )) as unknown as Option<DarwiniaStakingLedgerEncoded>;

        const depositsInfo: Option<Vec<DepositEncoded>> = (await api.query.accountMigration.deposits(
          accountId
        )) as unknown as Option<Vec<DepositEncoded>>;

        const vestedAmountRing = BigNumber(0); // vestings have been removed
        let totalBalance = BigNumber(0);
        let reservedAmount = BigNumber(0);

        const tempAccountInfoOption = await api.query.accountMigration.accounts(accountId);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const accountInfoOption = tempAccountInfoOption as Option<FrameSystemAccountInfo>;

        if (accountInfoOption.isSome) {
          const unwrappedAccountInfo = accountInfoOption.unwrap();
          const accountInfo = unwrappedAccountInfo.toHuman() as unknown as FrameSystemAccountInfo;
          const balance = accountInfo.data.free.toString().replaceAll(",", "");
          const reserved = accountInfo.data.reserved.toString().replaceAll(",", "");
          totalBalance = BigNumber(balance);
          reservedAmount = BigNumber(reserved);
        }

        // vestings have been removed
        // const vestingInfoOption = (await api.query.accountMigration.vestings(accountId)) as unknown as Option<
        //   Vec<PalletVestingVestingInfo>
        // >;
        // if (vestingInfoOption.isSome) {
        //   const unwrappedVestingInfo = vestingInfoOption.unwrap();
        //   const vestingInfoList = unwrappedVestingInfo.toHuman() as unknown as Vec<PalletVestingVestingInfo>;
        //   vestingInfoList.forEach((vesting) => {
        //     const lockedAmount = vesting.locked.toString().replaceAll(",", "");
        //     vestedAmountRing = vestedAmountRing.plus(lockedAmount);
        //   });
        // }

        const parseData = (
          ledgerOption: Option<DarwiniaStakingLedgerEncoded> | undefined,
          depositsOption: Option<Vec<DepositEncoded>> | undefined
        ): AssetDistribution | undefined => {
          if (!ledgerOption || !depositsOption) {
            return undefined;
          }

          let totalDepositsAmount = BigNumber(0);

          if (depositsOption.isSome) {
            const unwrappedDeposits = depositsOption.unwrap();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const depositsData = unwrappedDeposits.toHuman() as Deposit[];
            /*depositsData here is not a real Deposit[], it's just a casting hack */
            depositsData.forEach((item) => {
              const amount = BigNumber(item.value.toString().replaceAll(",", ""));
              totalDepositsAmount = totalDepositsAmount.plus(amount);
            });
          }

          if (ledgerOption.isSome) {
            const unwrappedLedger = ledgerOption.unwrap();
            /*ledgerData here is not a real DarwiniaStakingLedger, it's just a casting hack */
            const ledgerData = unwrappedLedger.toHuman() as unknown as DarwiniaStakingLedger;
            /*These are the IDs of the deposits that have been used in staking*/
            const stakedDepositsIdsList: number[] = [];
            ledgerData.stakedDeposits?.forEach((item) => {
              const depositId = item.toString().replaceAll(",", "");
              stakedDepositsIdsList.push(Number(depositId));
            });

            ledgerData.stakedRing = BigNumber(ledgerData.stakedRing.toString().replaceAll(",", ""));
            ledgerData.stakedKton = BigNumber(ledgerData.stakedKton.toString().replaceAll(",", ""));
            ledgerData.stakedDeposits = [...stakedDepositsIdsList];
            ledgerData.unstakingDeposits =
              ledgerData.unstakingDeposits?.map((item) => {
                return [Number(item[0].toString().replaceAll(",", "")), Number(item[1].toString().replaceAll(",", ""))];
              }) ?? [];
            ledgerData.unstakingRing =
              ledgerData.unstakingRing?.map((item) => {
                return [Number(item[0].toString().replaceAll(",", "")), Number(item[1].toString().replaceAll(",", ""))];
              }) ?? [];
            ledgerData.unstakingKton =
              ledgerData.unstakingKton?.map((item) => {
                return [Number(item[0].toString().replaceAll(",", "")), Number(item[1].toString().replaceAll(",", ""))];
              }) ?? [];

            let unbondingRingAmount = BigNumber(0);
            let unbondedRingAmount = BigNumber(0);
            ledgerData.unstakingRing.forEach(([amount, lastBlockNumber]) => {
              const isExpired = currentBlock.number >= lastBlockNumber;
              if (isExpired) {
                unbondedRingAmount = unbondedRingAmount.plus(amount);
              } else {
                unbondingRingAmount = unbondingRingAmount.plus(amount);
              }
            });

            let unbondingKtonAmount = BigNumber(0);
            let unbondedKtonAmount = BigNumber(0);
            ledgerData.unstakingKton.forEach(([amount, lastBlockNumber]) => {
              const isExpired = currentBlock.number >= lastBlockNumber;
              if (isExpired) {
                unbondedKtonAmount = unbondedKtonAmount.plus(amount);
              } else {
                unbondingKtonAmount = unbondingKtonAmount.plus(amount);
              }
            });

            /*Avoid showing the user some negative value when the totalBalance is zero*/
            const transferableRing = totalBalance.gt(0)
              ? totalBalance
                  .plus(reservedAmount)
                  .minus(vestedAmountRing)
                  .minus(ledgerData.stakedRing)
                  .minus(totalDepositsAmount)
                  .minus(unbondedRingAmount)
                  .minus(unbondingRingAmount)
              : BigNumber(0);
            const transferableKTON = ktonBalance
              .minus(ledgerData.stakedKton)
              .minus(unbondedKtonAmount)
              .minus(unbondingKtonAmount);

            if (isDataAtPoint) {
              const asset = {
                ring: {
                  transferable: transferableRing,
                  deposit: totalDepositsAmount,
                  bonded: ledgerData.stakedRing,
                  unbonded: unbondedRingAmount,
                  unbonding: unbondingRingAmount,
                  vested: vestedAmountRing,
                },
                kton: {
                  transferable: transferableKTON,
                  bonded: ledgerData.stakedKton,
                  unbonded: unbondedKtonAmount,
                  unbonding: unbondingKtonAmount,
                },
              };
              if (!hasReturnOutput) {
                setMigratedAssetDistribution(asset);
              }
              return asset;
            } else {
              const asset = {
                ring: {
                  transferable: transferableRing,
                  deposit: totalDepositsAmount,
                  bonded: ledgerData.stakedRing,
                  unbonded: unbondedRingAmount,
                  unbonding: unbondingRingAmount,
                  vested: vestedAmountRing,
                },
                kton: {
                  transferable: transferableKTON,
                  bonded: ledgerData.stakedKton,
                  unbonded: unbondedKtonAmount,
                  unbonding: unbondingKtonAmount,
                },
              };
              if (!hasReturnOutput) {
                setStakedAssetDistribution(asset);
              }
              return asset;
            }
          } else {
            // this user never took part in staking
            if (isDataAtPoint) {
              const transferableRing = totalBalance.gt(0)
                ? totalBalance.plus(reservedAmount).minus(totalDepositsAmount).minus(vestedAmountRing)
                : BigNumber(0);
              const transferableKTON = ktonBalance;

              const asset = {
                ring: {
                  transferable: transferableRing,
                  deposit: totalDepositsAmount,
                  bonded: BigNumber(0),
                  unbonded: BigNumber(0),
                  unbonding: BigNumber(0),
                  vested: vestedAmountRing,
                },
                kton: {
                  transferable: transferableKTON,
                  bonded: BigNumber(0),
                  unbonded: BigNumber(0),
                  unbonding: BigNumber(0),
                },
              };
              if (!hasReturnOutput) {
                setMigratedAssetDistribution(asset);
              }
              return asset;
            } else {
              const transferableRing = totalBalance.gt(0)
                ? totalBalance.plus(reservedAmount).minus(totalDepositsAmount)
                : BigNumber(0);
              const transferableKTON = ktonBalance;

              const asset = {
                ring: {
                  transferable: transferableRing,
                  deposit: totalDepositsAmount,
                  bonded: BigNumber(0),
                  unbonded: BigNumber(0),
                  unbonding: BigNumber(0),
                  vested: vestedAmountRing,
                },
                kton: {
                  transferable: transferableKTON,
                  bonded: BigNumber(0),
                  unbonded: BigNumber(0),
                  unbonding: BigNumber(0),
                },
              };
              if (!hasReturnOutput) {
                setStakedAssetDistribution(asset);
              }
              return asset;
            }
          }
        };

        const asset = parseData(ledgerInfo, depositsInfo);

        if (isDataAtPoint) {
          setLoadingMigratedLedger(false);
        } else {
          setLoadingLedger(false);
        }
        setLoadingWalletLedger(false);
        return Promise.resolve(asset);
      };
      const asset = await getStakingLedgerAndDeposits().catch((e) => {
        console.error(e);
        if (isDataAtPoint) {
          setMigratedAssetDistribution({
            ring: {
              transferable: BigNumber(0),
              deposit: BigNumber(0),
              bonded: BigNumber(0),
              unbonded: BigNumber(0),
              unbonding: BigNumber(0),
              vested: BigNumber(0),
            },
            kton: {
              transferable: BigNumber(0),
              bonded: BigNumber(0),
              unbonded: BigNumber(0),
              unbonding: BigNumber(0),
            },
          });
        } else {
          setStakedAssetDistribution({
            ring: {
              transferable: BigNumber(0),
              deposit: BigNumber(0),
              bonded: BigNumber(0),
              unbonded: BigNumber(0),
              unbonding: BigNumber(0),
              vested: BigNumber(0),
            },
            kton: {
              transferable: BigNumber(0),
              bonded: BigNumber(0),
              unbonded: BigNumber(0),
              unbonding: BigNumber(0),
            },
          });
        }
        setLoadingMigratedLedger(false);
        setLoadingLedger(false);
        setLoadingWalletLedger(false);

        // console.log(e);
        //ignore
      });

      return Promise.resolve(asset);
    },
    [apiPromise, currentBlock]
  );

  /*Get staking ledger and deposits. The data that comes back from the server needs a lot of decoding */
  useEffect(() => {
    /* get new balance for every newly selected account */
    if (selectedAccount) {
      getAccountAsset(selectedAccount);
    }
  }, [apiPromise, selectedAccount]);

  const retrieveMigratedAsset = useCallback(
    (sourceAccountId: string, parentBlockHash: string) => {
      getAccountAsset(sourceAccountId, parentBlockHash);
    },
    [apiPromise, currentBlock]
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
