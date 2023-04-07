import { gql } from "@apollo/client";

export const FIND_MIGRATION_BY_SOURCE_ADDRESS = gql`
  query migrationQuery($accountAddress: String!) {
    accountMigration(id: $accountAddress) {
      id
      destination
      parentHash
      transactionHash
      blockTime
      blockNumber
    }
  }
`;

export const FIND_MULTISIG_MIGRATION_BY_SOURCE_ADDRESS = gql`
  query multisigMigrationQuery($accountAddress: String!) {
    multisigAccountMigration(id: $accountAddress) {
      id
      params
      blockTime
      blockNumber
    }
  }
`;

export const FIND_MIGRATION_DESTINATION_PARAMS_BY_SOURCE_ADDRESS = gql`
  query multisigDestinationMigrationQuery($accountAddress: String!) {
    multisigDestinationAccount(id: $accountAddress) {
      id
      params
      blockTime
      blockNumber
    }
  }
`;
