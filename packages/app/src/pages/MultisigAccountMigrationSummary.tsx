import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import TokensBalanceSummary from "../components/TokensBalanceSummary";
import MultisigAccountInfo from "../components/MultisigAccountInfo";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import MultisigMigrationProgressTabs from "../components/MultisigMigrationProgressTabs";
import MigrationSummary from "../components/MigrationSummary";
import { useWallet } from "@darwinia/app-providers";
import { convertToSS58 } from "@darwinia/app-utils";
import { DarwiniaAccountMigrationMultisig } from "@darwinia/app-types";

const MultisigAccountMigrationSummary = () => {
  const { t } = useAppTranslation();
  const { checkMultisigAccountMigrationStatus, selectedNetwork, apiPromise, isMultisigAccountMigratedJustNow } =
    useWallet();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const address = convertToSS58(params.get("address") ?? "", selectedNetwork?.prefix ?? 18);
  const [isSuccessfullyMigrated, setIsSuccessfullyMigrated] = useState<boolean>(false);
  const [isIsWaitingToDeploy, setIsWaitingToDeploy] = useState<boolean>(false);
  const [multisigMigrationStatus, setMultisigMigrationStatus] = useState<DarwiniaAccountMigrationMultisig>();

  useEffect(() => {
    const checkStatus = async () => {
      const result = await checkMultisigAccountMigrationStatus(address);
      setMultisigMigrationStatus(result);
    };
    if (apiPromise || isMultisigAccountMigratedJustNow) {
      checkStatus().catch((e) => {
        console.log(e);
        //ignore
      });
    }
  }, [apiPromise, isMultisigAccountMigratedJustNow]);

  const footerLinks = [
    {
      title: t(localeKeys.howToMigrate),
      url: "https://www.notion.so/itering/How-to-migrate-the-account-to-Crab-2-0-9b8f835c914f44a29d9727a0a03b9f5d",
    },
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
      <MultisigAccountInfo isIsWaitingToDeploy={isIsWaitingToDeploy} isSuccessfullyMigrated={isSuccessfullyMigrated} />
      {multisigMigrationStatus ? (
        <MultisigMigrationProgressTabs
          isWaitingToDeploy={isIsWaitingToDeploy}
          migrationStatus={multisigMigrationStatus}
        />
      ) : (
        <MigrationSummary accountAddress={address} />
      )}
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

export default MultisigAccountMigrationSummary;
