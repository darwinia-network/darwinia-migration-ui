import MigrationProcess from "../components/MigrationProcess";
import MigrationStatus from "../components/MigrationStatus";
import { useWallet } from "@darwinia/app-providers";
import { useQuery } from "@apollo/client";
import { FIND_MIGRATION_BY_SOURCE_ADDRESS } from "@darwinia/app-config";
import { useEffect, useRef, useState } from "react";

interface MigrationQuery {
  accountAddress: string;
}

export interface AccountMigration {
  id: string;
  blockNumber: number;
  blockTime: string;
  destination: string;
  parentHash: string;
  transactionHash: string;
}

export interface MigrationResult {
  accountMigration?: AccountMigration;
}

const Migration = () => {
  const { isAccountMigratedJustNow, selectedAccount } = useWallet();
  const [accountMigrated, setAccountMigrated] = useState<boolean>();
  const migrationCheckRef = useRef<NodeJS.Timer>();

  const {
    loading: isLoading,
    data: migrationResult,
    error,
    refetch,
  } = useQuery<MigrationResult, MigrationQuery>(FIND_MIGRATION_BY_SOURCE_ADDRESS, {
    variables: {
      accountAddress: selectedAccount?.formattedAddress ?? "",
    },
  });

  useEffect(() => {
    if (!migrationResult || !migrationResult.accountMigration) {
      setAccountMigrated(false);
    } else {
      setAccountMigrated(true);
    }
  }, [migrationResult, isAccountMigratedJustNow]);

  useEffect(() => {
    if (migrationCheckRef.current) {
      clearInterval(migrationCheckRef.current);
    }
    /*when the account is just migrated, subquery won't have the data yet, keep looping until subquery has data */
    if (isAccountMigratedJustNow) {
      migrationCheckRef.current = setInterval(async () => {
        try {
          if (migrationResult?.accountMigration) {
            clearInterval(migrationCheckRef.current);
          }
          await refetch({
            accountAddress: selectedAccount?.formattedAddress ?? "",
          });
        } catch (e) {
          //ignore
        }
      }, 5000);
    }
    return () => {
      clearInterval(migrationCheckRef.current);
    };
  }, [isAccountMigratedJustNow, migrationResult]);

  return accountMigrated || isAccountMigratedJustNow ? (
    <MigrationStatus accountMigration={migrationResult?.accountMigration} />
  ) : (
    <MigrationProcess isCheckingMigrationStatus={isLoading} />
  );
};

export default Migration;
