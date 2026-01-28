import { useStorage, useWallet } from "@darwinia/app-providers";
import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import Identicon from "@polkadot/react-identicon";
import MigrationSummary from "../MigrationSummary";
import MigrationForm from "../MigrationForm";
import { useEffect, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import { notification } from "@darwinia/ui";
import { CustomInjectedAccountWithMeta } from "@darwinia/app-types";

interface Props {
  isCheckingMigrationStatus: boolean;
}

const MigrationProcess = ({ isCheckingMigrationStatus }: Props) => {
  const { selectedAccount } = useWallet();
  const { migrationAssetDistribution, isLoadingLedger } = useStorage();
  const { t } = useAppTranslation();
  const [showMigrationForm, setShowMigrationForm] = useState<boolean>(false);
  const currentAccount = useRef<CustomInjectedAccountWithMeta>();
  const canShowAccountNotification = useRef(false);

  useEffect(() => {
    if (currentAccount.current?.formattedAddress !== selectedAccount?.formattedAddress) {
      currentAccount.current = selectedAccount;
      canShowAccountNotification.current = true;
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (migrationAssetDistribution && !isLoadingLedger) {
      const hasRingAmount =
        migrationAssetDistribution.ring.transferable.gt(0) ||
        migrationAssetDistribution.ring.deposit?.gt(0) ||
        migrationAssetDistribution.ring.bonded.gt(0) ||
        migrationAssetDistribution.ring.unbonded.gt(0) ||
        migrationAssetDistribution.ring.unbonding.gt(0) ||
        migrationAssetDistribution.ring.vested?.gt(0);
      const hasKtonAmount =
        migrationAssetDistribution.kton.transferable.gt(0) ||
        migrationAssetDistribution.kton.bonded.gt(0) ||
        migrationAssetDistribution.kton.unbonded.gt(0) ||
        migrationAssetDistribution.kton.unbonding.gt(0);
      if (hasRingAmount || hasKtonAmount) {
        setShowMigrationForm(true);
      } else {
        // makes sure that the prompt is only shown once when the selected account changes
        if (canShowAccountNotification.current) {
          canShowAccountNotification.current = false;
          notification.error({
            message: <div>{t(localeKeys.noTokensToMigrate)}</div>,
          });
        }
        setShowMigrationForm(false);
      }
    }
  }, [migrationAssetDistribution, isLoadingLedger]);

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
    <div className={"flex flex-col gap-[30px]"}>
      <div className={"flex items-center card gap-[20px]"}>
        <Identicon
          value={selectedAccount?.formattedAddress}
          size={30}
          className={"rounded-full bg-white self-start lg:self-center shrink-0"}
          theme={"polkadot"}
        />
        <div className={"flex flex-col lg:flex-row lg:items-center flex-ellipsis gap-[8px]"}>
          <div>{selectedAccount?.prettyName}</div>
          <div className={"hidden lg:flex"}>-</div>
          <div>{selectedAccount?.formattedAddress}</div>
        </div>
      </div>
      <MigrationSummary isCheckingMigrationStatus={isCheckingMigrationStatus} />
      {showMigrationForm && <MigrationForm />}
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

export default MigrationProcess;
