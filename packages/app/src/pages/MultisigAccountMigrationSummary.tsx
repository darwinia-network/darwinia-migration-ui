import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import TokensBalanceSummary from "../components/TokensBalanceSummary";
import MultisigAccountInfo from "../components/MultisigAccountInfo";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import MultisigMigrationProgressTabs from "../components/MultisigMigrationProgressTabs";
import MigrationSummary from "../components/MigrationSummary";

const MultisigAccountMigrationSummary = () => {
  const { t } = useAppTranslation();
  const [isAccountMigrationInitialized, setAccountMigrationInitialized] = useState<boolean>(true);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const address = params.get("address");
  const members = (params.get("who") ?? "").split(",");
  const name = params.get("name");
  const threshold = params.get("threshold");

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
      <MultisigAccountInfo />
      <MigrationSummary accountAddress={address} />
      {isAccountMigrationInitialized ? (
        <MultisigMigrationProgressTabs />
      ) : (
        <div className={"card"}>
          <TokensBalanceSummary asset={undefined} />
        </div>
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
