import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import TokensBalanceSummary from "../components/TokensBalanceSummary";
import MultisigAccountInfo from "../components/MultisigAccountInfo";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import MultisigMigrationProgressTabs from "../components/MultisigMigrationProgressTabs";
import MigrationSummary from "../components/MigrationSummary";
import { useWallet } from "@darwinia/app-providers";
import { convertToSS58 } from "@darwinia/app-utils";
import { DarwiniaSourceAccountMigrationMultisig, MultisigDestinationParams } from "@darwinia/app-types";
import { useQuery } from "@apollo/client";
import {
  FIND_MULTISIG_MIGRATION_BY_SOURCE_ADDRESS,
  FIND_MIGRATION_DESTINATION_PARAMS_BY_SOURCE_ADDRESS,
} from "@darwinia/app-config";
import { MigrationResult } from "./Migration";
import { notification } from "@darwinia/ui";

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

export interface MultisigDestinationAccountMigration {
  id: string;
  blockNumber: number;
  blockTime: string;
  params: MultisigDestinationParams;
}

interface MultisigDestinationMigrationResult {
  multisigDestinationAccount?: MultisigDestinationAccountMigration;
}

export interface AccountBasicInfo {
  threshold: number;
  members: string[];
  name: string;
  address: string;
  initializer: string;
  destinationMembers?: string[];
  destinationThreshold?: number;
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
  const sourceAddress = convertToSS58(params.get("address") ?? "", selectedNetwork?.prefix ?? 18).trim();
  const initializer = convertToSS58(params.get("initializer") ?? "", selectedNetwork?.prefix ?? 18);
  const sourceMembers = (params.get("who") ?? "")
    .split(",")
    .map((address) => convertToSS58(address, selectedNetwork?.prefix ?? 18));
  const sourceAccountName = params.get("name") ?? "";
  const sourceThreshold = params.get("threshold");

  const [isSuccessfullyMigrated, setIsSuccessfullyMigrated] = useState<boolean>(false);
  const [isWaitingToDeploy, setIsWaitingToDeploy] = useState<boolean>(false);
  const [sourceMultisigMigrationStatus, setSourceMultisigMigrationStatus] =
    useState<DarwiniaSourceAccountMigrationMultisig>();
  const [multisigDestinationParams, setMultisigDestinationParams] = useState<MultisigDestinationParams>();
  const [accountBasicInfo, setAccountBasicInfo] = useState<AccountBasicInfo>();
  const refetchRef = useRef<NodeJS.Timeout | null>(null);
  const [isMigrationInitialized, setMigrationInitialized] = useState<boolean>(false);

  const {
    loading: isCheckingSubqueryMultisigMigrationCompletion,
    data: multisigMigrationResult,
    error: multisigError,
    refetch: refetchMultisigMigrationResult,
  } = useQuery<MultisigSourceMigrationResult, MigrationQuery>(FIND_MULTISIG_MIGRATION_BY_SOURCE_ADDRESS, {
    variables: {
      accountAddress: sourceAddress,
    },
  });

  const {
    loading: isCheckingSubqueryDestinationMigration,
    data: migrationDestinationResult,
    error: destinationError,
  } = useQuery<MultisigDestinationMigrationResult, MigrationQuery>(
    FIND_MIGRATION_DESTINATION_PARAMS_BY_SOURCE_ADDRESS,
    {
      variables: {
        accountAddress: sourceAddress,
      },
    },
  );

  // this will hide both the tabs section and the account summary when the component is mounted
  useEffect(() => {
    setIsCheckingMultisigCompleted(true);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingMultisigCompleted(true);
      /*Check if the account has initialized any migration yet*/
      const result = await checkMultisigAccountMigrationStatus(sourceAddress);
      setMultisigDestinationParams(undefined);
      setSourceMultisigMigrationStatus(undefined);
      if (result) {
        setMigrationInitialized(true);
        //account data is found on the chain, the account has initialized some migration
        const { to, members: sourceMembers, threshold: sourceThreshold } = result;
        let destinationThreshold = 0;
        let destinationMembers: string[] = [];
        /*Check if migrationDestinationResult.multisigDestinationAccount has anything, there is something
         * if and only if the migration is to another multisig account, otherwise, default it to the fact that
         * he is migrating to a general account */
        if (migrationDestinationResult && migrationDestinationResult.multisigDestinationAccount) {
          /* The user has initialized migration of this account to another multisig account */
          const { params } = migrationDestinationResult.multisigDestinationAccount;
          destinationThreshold = params.threshold;
          destinationMembers = params.members;
        }

        setIsWaitingToDeploy(false);
        setIsSuccessfullyMigrated(false);

        setMultisigDestinationParams({
          threshold: destinationThreshold,
          address: to,
          members: destinationMembers,
        });
        setSourceMultisigMigrationStatus(result);
        setAccountBasicInfo({
          name: sourceAccountName,
          threshold: sourceThreshold,
          destinationThreshold: destinationThreshold,
          members: sourceMembers.map((member) => member[0]),
          address: sourceAddress,
          initializer: initializer,
        });
      } else {
        //the account either doesn't exist on the chain or hasn't started migration yet or was already migrated
        //check subquery to see if migration is completed
        if (multisigMigrationResult && multisigMigrationResult.multisigAccountMigration) {
          /* account migration was initialized and the threshold count has been reached, this account is
           * ready to deploy, check if it was deployed already or not */
          setMigrationInitialized(true);
          const destinationAddress = multisigMigrationResult.multisigAccountMigration.params.to;
          //this account has completed migration, check if it was deployed or not
          const isDeployed = await isMultisigAccountDeployed(destinationAddress);

          let destinationThreshold = 0;
          let destinationMembers: string[] = [];
          /*Check if migrationDestinationResult.multisigDestinationAccount has anything, there is something
           * if and only if the migration is to another multisig account, otherwise, default it to the fact that
           * he is migrating to a general account */
          if (migrationDestinationResult && migrationDestinationResult.multisigDestinationAccount) {
            /* The user has initialized migration of this account to another multisig account */
            const { params } = migrationDestinationResult.multisigDestinationAccount;
            destinationThreshold = params.threshold;
            destinationMembers = params.members;
            if (isDeployed) {
              setIsWaitingToDeploy(false);
              setIsSuccessfullyMigrated(true);
            } else {
              setIsWaitingToDeploy(true);
              setIsSuccessfullyMigrated(false);
            }
          } else {
            // this account was migrated to a general account
            setIsWaitingToDeploy(false);
            setIsSuccessfullyMigrated(true);
          }
          setMultisigDestinationParams({
            threshold: destinationThreshold,
            address: destinationAddress,
            members: destinationMembers,
          });

          const {
            id: from,
            params: { to, members: sourceMembers, threshold: sourceThreshold },
          } = multisigMigrationResult.multisigAccountMigration;
          setSourceMultisigMigrationStatus({
            threshold: sourceThreshold,
            members: sourceMembers,
            to: to,
          });
          setAccountBasicInfo({
            name: sourceAccountName,
            address: from,
            threshold: Number(sourceThreshold ?? 0),
            members: sourceMembers.map((member) => member[0]),
            initializer: initializer,
            destinationThreshold: destinationThreshold,
            destinationMembers: destinationMembers,
          });
        } else {
          setMigrationInitialized(false);
          /* this account doesn't exist, or it hasn't initialized migration yet, but most likely
           * hasn't initialized migration yet */
          //check if the address existed in Darwinia 1.0
          console.log(`The account ${sourceAddress} never existed on this chain or hasn't initiated migration yet`);
          setSourceMultisigMigrationStatus(undefined);
          setMultisigDestinationParams(undefined);
          /*Take the data from the URL*/
          setAccountBasicInfo({
            name: sourceAccountName,
            address: sourceAddress,
            threshold: Number(sourceThreshold ?? 0),
            members: sourceMembers,
            initializer: initializer,
          });
          if (isMultisigAccountMigratedJustNow) {
            if (refetchRef.current) {
              clearInterval(refetchRef.current as NodeJS.Timeout);
            }
            refetchRef.current = setInterval(async () => {
              await refetchMultisigMigrationResult({
                accountAddress: sourceAddress,
              });
              if (multisigMigrationResult && multisigMigrationResult.multisigAccountMigration) {
                clearInterval(refetchRef.current as NodeJS.Timeout);
              }
            }, 5000);
          }
        }
      }

      setIsCheckingMultisigCompleted(false);
    };

    if (
      apiPromise ||
      isMultisigAccountMigratedJustNow ||
      !isCheckingSubqueryMultisigMigrationCompletion ||
      !isCheckingSubqueryDestinationMigration
    ) {
      checkStatus().catch((e) => {
        setIsCheckingMultisigCompleted(false);
        console.log(e);
        //ignore
      });
    }

    return () => {
      if (refetchRef.current) {
        clearInterval(refetchRef.current as NodeJS.Timeout);
      }
    };
  }, [
    apiPromise,
    isMultisigAccountMigratedJustNow,
    multisigMigrationResult,
    migrationDestinationResult,
    isCheckingSubqueryMultisigMigrationCompletion,
    isCheckingSubqueryDestinationMigration,
  ]);

  const onDeploymentSuccessful = () => {
    setIsWaitingToDeploy(false);
    setIsSuccessfullyMigrated(true);
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
      <MultisigAccountInfo
        onDeploymentSuccessful={onDeploymentSuccessful}
        isMigrationInitialized={isMigrationInitialized}
        accountBasicInfo={accountBasicInfo}
        isWaitingToDeploy={isWaitingToDeploy}
        isSuccessfullyMigrated={isSuccessfullyMigrated}
      />
      {!isCheckingMultisigCompleted && (
        <>
          {multisigDestinationParams && sourceMultisigMigrationStatus ? (
            <MultisigMigrationProgressTabs
              isWaitingToDeploy={isWaitingToDeploy}
              isSuccessfullyMigrated={isSuccessfullyMigrated}
              multisigDestinationParams={multisigDestinationParams}
              sourceMultisigMigrationStatus={sourceMultisigMigrationStatus}
            />
          ) : (
            <MigrationSummary accountAddress={sourceAddress} />
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
