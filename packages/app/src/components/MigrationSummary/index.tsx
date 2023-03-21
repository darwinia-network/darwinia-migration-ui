import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import { useStorage, useWallet } from "@darwinia/app-providers";
import ringIcon from "../../assets/images/ring.svg";
import ktonIcon from "../../assets/images/kton.svg";
import crabIcon from "../../assets/images/crab.svg";
import cktonIcon from "../../assets/images/ckton.svg";
import helpIcon from "../../assets/images/help.svg";
import { Tooltip } from "@darwinia/ui";
import { prettifyNumber, prettifyTooltipNumber } from "@darwinia/app-utils";
import BigNumber from "bignumber.js";
import { useEffect } from "react";
import TokensBalanceSummary from "../TokensBalanceSummary";

interface Props {
  isCheckingMigrationStatus: boolean;
}

const MigrationSummary = ({ isCheckingMigrationStatus }: Props) => {
  const { t } = useAppTranslation();
  const { selectedNetwork, setTransactionStatus } = useWallet();
  const { migrationAssetDistribution, isLoadingLedger } = useStorage();

  useEffect(() => {
    setTransactionStatus(!!isLoadingLedger || isCheckingMigrationStatus);
  }, [isLoadingLedger, isCheckingMigrationStatus]);

  const ringTokenIcon = selectedNetwork?.name === "Crab" ? crabIcon : ringIcon;
  const ktonTokenIcon = selectedNetwork?.name === "Crab" ? cktonIcon : ktonIcon;

  return (
    <div className={"card flex gap-[20px] flex-col"}>
      <TokensBalanceSummary asset={migrationAssetDistribution} />
      <div className={"text-12"}>{t(localeKeys.migrationSummaryInfo)}</div>
    </div>
  );
};

export default MigrationSummary;
