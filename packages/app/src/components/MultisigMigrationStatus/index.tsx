import migrationIcon from "../../assets/images/migration.svg";
import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import successIcon from "../../assets/images/success.svg";
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

const MultisigMigrationStatus = ({ accountMigration }: Props) => {
  const { t } = useAppTranslation();
  const { selectedNetwork, setTransactionStatus } = useWallet();
  const { retrieveMigratedAsset, migratedAssetDistribution, isLoadingMigratedLedger } = useStorage();

  /*useEffect(() => {
    setTransactionStatus(!!isLoadingMigratedLedger);
  }, [isLoadingMigratedLedger]);*/

  useEffect(() => {
    if (accountMigration) {
      retrieveMigratedAsset(accountMigration.id, accountMigration.parentHash);
    }
  }, [accountMigration]);

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

  const footerLinks = [
    {
      title: t(localeKeys.darwiniaMergeOverview),
      url: "https://medium.com/darwinianetwork/darwinia-2-0-merge-overview-96af96d668aa",
    },
    {
      title: t(localeKeys.darwiniaDataMigration),
      url: "https://medium.com/darwinianetwork/darwinia-2-0-blockchain-data-migration-c1186338c743",
    },
  ];

  return (
    <div className={"flex flex-col gap-[20px]"}>
      <div>Migration status</div>
      <div className={"flex flex-col lg:flex-row justify-between"}>
        {footerLinks.map((item, index) => {
          return (
            <a
              key={index}
              className={"text-14-bold link link-primary"}
              href={item.url}
              rel={"noreferrer"}
              target={"_blank"}
            >
              {item.title}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default MultisigMigrationStatus;
