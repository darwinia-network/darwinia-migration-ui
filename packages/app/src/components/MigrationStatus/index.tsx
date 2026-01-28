import migrationIcon from "../../assets/images/migration.svg";
import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import successIcon from "../../assets/images/success.svg";
import pendingIcon from "../../assets/images/pending.svg";
import copyIcon from "../../assets/images/copy.svg";
import clockIcon from "../../assets/images/clock.svg";
import ringIcon from "../../assets/images/ring.svg";
import ktonIcon from "../../assets/images/kton.svg";
import helpIcon from "../../assets/images/help.svg";
import { Tooltip } from "@darwinia/ui";
import { useStorage, useWallet } from "@darwinia/app-providers";
import { AccountMigration } from "../../pages/Migration";
import { useEffect } from "react";
import BigNumber from "bignumber.js";
import {
  copyToClipboard,
  formatTimeInUTC,
  prettifyNumber,
  prettifyTooltipNumber,
  toTimeAgo,
} from "@darwinia/app-utils";

interface Props {
  accountMigration?: AccountMigration;
}

const MigrationStatus = ({ accountMigration }: Props) => {
  const { t } = useAppTranslation();
  const { selectedNetwork, setTransactionStatus } = useWallet();
  const { retrieveMigratedAsset, migratedAssetDistribution, isLoadingMigratedLedger } = useStorage();

  useEffect(() => {
    setTransactionStatus(!!isLoadingMigratedLedger);
  }, [isLoadingMigratedLedger]);

  useEffect(() => {
    if (accountMigration) {
      retrieveMigratedAsset(accountMigration.id, accountMigration.parentHash);
    }
  }, [accountMigration]);

  const ringTokenIcon = ringIcon;
  const ktonTokenIcon = ktonIcon;

  const getRingTooltipMessage = () => {
    return (
      <div className={"flex gap-[10px] text-12 flex-col"}>
        <div>
          {t(localeKeys.transferable)}:{" "}
          {prettifyTooltipNumber(migratedAssetDistribution?.ring.transferable ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.deposit)}: {prettifyTooltipNumber(migratedAssetDistribution?.ring.deposit ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.bonded)}: {prettifyTooltipNumber(migratedAssetDistribution?.ring.bonded ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.unbonded)}: {prettifyTooltipNumber(migratedAssetDistribution?.ring.unbonded ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.unbonding)}: {prettifyTooltipNumber(migratedAssetDistribution?.ring.unbonding ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.vested)}: {prettifyTooltipNumber(migratedAssetDistribution?.ring.vested ?? BigNumber(0))}
        </div>
      </div>
    );
  };

  const getKtonTooltipMessage = () => {
    return (
      <div className={"flex gap-[10px] text-12 flex-col"}>
        <div>
          {t(localeKeys.transferable)}:{" "}
          {prettifyTooltipNumber(migratedAssetDistribution?.kton.transferable ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.bonded)}: {prettifyTooltipNumber(migratedAssetDistribution?.kton.bonded ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.unbonded)}: {prettifyTooltipNumber(migratedAssetDistribution?.kton.unbonded ?? BigNumber(0))}
        </div>
        <div>
          {t(localeKeys.unbonding)}: {prettifyTooltipNumber(migratedAssetDistribution?.kton.unbonding ?? BigNumber(0))}
        </div>
      </div>
    );
  };

  const totalRING =
    migratedAssetDistribution?.ring.bonded
      .plus(migratedAssetDistribution?.ring.deposit ?? BigNumber(0))
      .plus(migratedAssetDistribution?.ring.transferable)
      .plus(migratedAssetDistribution?.ring.unbonded)
      .plus(migratedAssetDistribution?.ring.unbonding)
      .plus(migratedAssetDistribution?.ring.vested ?? BigNumber(0)) ?? BigNumber(0);

  const totalKTON =
    migratedAssetDistribution?.kton.bonded
      .plus(migratedAssetDistribution?.kton.transferable)
      .plus(migratedAssetDistribution?.ring.unbonded)
      .plus(migratedAssetDistribution?.ring.unbonding) ?? BigNumber(0);

  const onCopyTransactionHash = () => {
    copyToClipboard(accountMigration?.transactionHash ?? "");
  };

  return (
    <div className={"flex flex-col gap-[20px]"}>
      <div className={"flex flex-col gap-[20px]"}>
        <div className={"flex gap-[20px] items-center"}>
          <img className={"w-[40px]"} src={migrationIcon} alt="migration" />
          <div className={"text-24-bold"} dangerouslySetInnerHTML={{ __html: t(localeKeys.accountMigrationTitle) }} />
        </div>
        {accountMigration && (
          <div className={"text-12-bold leading-[24px]"}>
            <div>{t(localeKeys.accountMigratedSuccessfully)}</div>
            <div
              dangerouslySetInnerHTML={{
                __html: t(localeKeys.whereNextAfterMigration, {
                  link: "https://staking.darwinia.network",
                }),
              }}
            />
          </div>
        )}
      </div>
      <div className={"card flex flex-col gap-[10px]"}>
        <div className={"flex justify-between py-[14px]"}>
          <div className={"min-w-[150px] lg:min-w-[200px]"}>{t(localeKeys.status)}</div>
          <div className={"flex-1 flex gap-[10px] items-center"}>
            <img className={"w-[18px] shrink-0"} src={accountMigration ? successIcon : pendingIcon} alt="image" />
            <div>
              {accountMigration ? (
                <div className={"text-success"}>{t(localeKeys.success)}</div>
              ) : (
                <div className={"text-white"}>{t(localeKeys.pending)}</div>
              )}
            </div>
          </div>
        </div>
        <div className={"flex justify-between py-[14px]"}>
          <div className={"min-w-[150px] lg:min-w-[200px]"}>{t(localeKeys.transactionHash)}</div>
          {accountMigration && (
            <div className={"flex-1 flex gap-[10px] items-center flex-ellipsis"}>
              <div className={"text-primary text-14-bold"}>{accountMigration?.transactionHash}</div>
              <img
                onClick={() => {
                  onCopyTransactionHash();
                }}
                className={"w-[16px] shrink-0 clickable"}
                src={copyIcon}
                alt="image"
              />
            </div>
          )}
        </div>
        <div className={"flex justify-between py-[14px] divider "}>
          <div className={"min-w-[150px] lg:min-w-[200px]"}>{t(localeKeys.timestamp)}</div>
          {accountMigration?.blockTime && (
            <div className={"flex-1 flex gap-[10px] items-center flex-ellipsis"}>
              <img className={"w-[18px] shrink-0"} src={clockIcon} alt="image" />
              <div>
                {toTimeAgo(accountMigration?.blockTime, true)} ({formatTimeInUTC(accountMigration?.blockTime)})
              </div>
            </div>
          )}
        </div>

        <div className={"divider border-b"} />

        <div className={"flex justify-between py-[14px]"}>
          <div className={"min-w-[150px] lg:min-w-[200px]"}>{t(localeKeys.migrateFrom)}</div>
          {accountMigration && (
            <div className={"flex-1 flex gap-[10px] items-center flex-ellipsis text-primary text-14-bold"}>
              <div>{accountMigration?.id}</div>
            </div>
          )}
        </div>
        <div className={"flex justify-between py-[14px]"}>
          <div className={"min-w-[150px] lg:min-w-[200px]"}>{t(localeKeys.migrateTo)}</div>
          {accountMigration && (
            <div className={"flex-1 flex gap-[10px] items-center flex-ellipsis text-primary text-14-bold"}>
              <div>{accountMigration?.destination}</div>
            </div>
          )}
        </div>

        {/*<div className={"flex justify-between py-[14px]"}>
          <div className={"min-w-[150px] lg:min-w-[200px]"}>{t(localeKeys.value)}</div>
          {accountMigration && (
            <div className={"flex-1 flex flex-col gap-[10px] flex-ellipsis"}>
              <div className={"flex gap-[10px] items-center"}>
                <img className={"w-[18px] shrink-0"} src={ringTokenIcon} alt="image" />
                <div className={"flex gap-[10px] items-center"}>
                  <Tooltip message={prettifyTooltipNumber(totalRING)}>
                    {prettifyNumber({
                      number: totalRING,
                    })}
                  </Tooltip>
                  {selectedNetwork?.ring.symbol.toUpperCase()}
                </div>
                <Tooltip className={"shrink-0"} message={getRingTooltipMessage()}>
                  <img className={"w-[16px] shrink-0 clickable"} src={helpIcon} alt="image" />
                </Tooltip>
              </div>
              <div className={"flex gap-[10px] items-center"}>
                <img className={"w-[18px] shrink-0"} src={ktonTokenIcon} alt="image" />
                <div className={"flex gap-[10px] items-center"}>
                  <Tooltip message={prettifyTooltipNumber(totalKTON)}>
                    {prettifyNumber({
                      number: totalKTON,
                    })}
                  </Tooltip>
                  {selectedNetwork?.kton.symbol.toUpperCase()}
                </div>
                <Tooltip className={"shrink-0"} message={getKtonTooltipMessage()}>
                  <img className={"w-[16px] shrink-0 clickable"} src={helpIcon} alt="image" />
                </Tooltip>
              </div>
            </div>
          )}
        </div>*/}
      </div>
    </div>
  );
};

export default MigrationStatus;
