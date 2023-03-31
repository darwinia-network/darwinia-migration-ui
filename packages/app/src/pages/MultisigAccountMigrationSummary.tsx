import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import TokensBalanceSummary from "../components/TokensBalanceSummary";
import MultisigAccountInfo from "../components/MultisigAccountInfo";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import MultisigMigrationProgressTabs from "../components/MultisigMigrationProgressTabs";
import MigrationSummary from "../components/MigrationSummary";
import { useWallet } from "@darwinia/app-providers";
import { convertToSS58 } from "@darwinia/app-utils";
import { DarwiniaSourceAccountMigrationMultisig } from "@darwinia/app-types";
import { useQuery } from "@apollo/client";
import { FIND_MIGRATION_BY_SOURCE_ADDRESS, FIND_MULTISIG_MIGRATION_BY_SOURCE_ADDRESS } from "@darwinia/app-config";
import { MigrationResult } from "./Migration";

interface MigrationQuery {
  accountAddress: string;
}

interface MultisigSourceParams {
  threshold: number;
  to: string;
  members: [string, boolean][];
}

export interface MultisigAccountMigration {
  id: string;
  blockNumber: number;
  blockTime: string;
  params: MultisigSourceParams;
}

interface MultisigSourceMigrationResult {
  multisigAccountMigration?: MultisigAccountMigration;
}

const MultisigAccountMigrationSummary = () => {
  const { t } = useAppTranslation();
  const {
    checkMultisigAccountMigrationStatus,
    selectedNetwork,
    apiPromise,
    isMultisigAccountMigratedJustNow,
    isMultisigAccountDeployed,
    setIsCheckingMultisigCompleted,
    isCheckingMultisigCompleted,
  } = useWallet();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const address = convertToSS58(params.get("address") ?? "", selectedNetwork?.prefix ?? 18).trim();
  const [isSuccessfullyMigrated, setIsSuccessfullyMigrated] = useState<boolean>(false);
  const [isWaitingToDeploy, setIsWaitingToDeploy] = useState<boolean>(false);
  const [sourceMultisigMigrationStatus, setSourceMultisigMigrationStatus] =
    useState<DarwiniaSourceAccountMigrationMultisig>();

  const {
    loading: isCheckingSubqueryMultisigMigrationCompletion,
    data: multisigMigrationResult,
    error: multisigError,
  } = useQuery<MultisigSourceMigrationResult, MigrationQuery>(FIND_MULTISIG_MIGRATION_BY_SOURCE_ADDRESS, {
    variables: {
      accountAddress: address,
    },
  });

  const {
    loading: isCheckingSubqueryMigration,
    data: migrationResult,
    error,
  } = useQuery<MigrationResult, MigrationQuery>(FIND_MIGRATION_BY_SOURCE_ADDRESS, {
    variables: {
      accountAddress: address,
    },
  });

  // this will hide both the tabs section and the account summary when the component is mounted
  useEffect(() => {
    setIsCheckingMultisigCompleted(true);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingMultisigCompleted(true);
      const result = await checkMultisigAccountMigrationStatus(address);

      if (!result) {
        //the account either doesn't exist or was already migrated
        //check subquery to see if migration is completed
        if (multisigMigrationResult && multisigMigrationResult.multisigAccountMigration) {
          const destinationAddress = multisigMigrationResult.multisigAccountMigration.params.to;
          //this account has completed migration, check if it was deployed or not
          const isDeployed = await isMultisigAccountDeployed(destinationAddress);
          if (isDeployed) {
            setIsWaitingToDeploy(false);
            setIsSuccessfullyMigrated(true);
          } else {
            setIsWaitingToDeploy(true);
            setIsSuccessfullyMigrated(false);
          }

          const {
            params: { to, members, threshold },
          } = multisigMigrationResult.multisigAccountMigration;
          setSourceMultisigMigrationStatus({
            threshold: threshold,
            members: members,
            migrateTo: to,
          });
        } else if (migrationResult && migrationResult.accountMigration) {
          /*this multisig account was migrated to a normal account */
          const destinationAddress = migrationResult.accountMigration.destination;
          //this account has completed migration, check if it was deployed or not
          const isDeployed = await isMultisigAccountDeployed(destinationAddress);
          if (isDeployed) {
            setIsWaitingToDeploy(false);
            setIsSuccessfullyMigrated(true);
          } else {
            setIsWaitingToDeploy(true);
            setIsSuccessfullyMigrated(false);
          }

          const { destination } = migrationResult.accountMigration;
          setSourceMultisigMigrationStatus({
            threshold: 0,
            members: [],
            migrateTo: destination,
          });
        } else {
          // this account doesn't exist or it hasn't initialized migration yet
          console.log(`The account ${address} never existed on this chain or hasn't initiated migration yet`);
          setSourceMultisigMigrationStatus(undefined);
        }
      } else {
        setSourceMultisigMigrationStatus(result);
      }
      setIsCheckingMultisigCompleted(false);
    };

    if (
      apiPromise ||
      isMultisigAccountMigratedJustNow ||
      !isCheckingSubqueryMultisigMigrationCompletion ||
      !isCheckingSubqueryMigration
    ) {
      checkStatus().catch((e) => {
        setIsCheckingMultisigCompleted(false);
        console.log(e);
        //ignore
      });
    }
  }, [
    apiPromise,
    isMultisigAccountMigratedJustNow,
    multisigMigrationResult,
    migrationResult,
    isCheckingSubqueryMultisigMigrationCompletion,
    isCheckingSubqueryMigration,
  ]);

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
  console.log("sourceMultisigMigrationStatus=====", sourceMultisigMigrationStatus);
  return (
    <div className={"flex flex-col gap-[20px]"}>
      <MultisigAccountInfo isWaitingToDeploy={isWaitingToDeploy} isSuccessfullyMigrated={isSuccessfullyMigrated} />
      {!isCheckingMultisigCompleted && (
        <>
          {sourceMultisigMigrationStatus ? (
            <MultisigMigrationProgressTabs
              isWaitingToDeploy={isWaitingToDeploy}
              isSuccessfullyMigrated={isSuccessfullyMigrated}
              migrationStatus={sourceMultisigMigrationStatus}
            />
          ) : (
            <MigrationSummary accountAddress={address} />
          )}
        </>
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
