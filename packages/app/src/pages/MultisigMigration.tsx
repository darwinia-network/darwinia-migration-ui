import MultisigMigrationProcess from "../components/MultisigMigrationProcess";

export interface AccountMigration {
  id: string;
  blockNumber: number;
  blockTime: string;
  destination: string;
  parentHash: string;
  transactionHash: string;
}

const Migration = () => {
  return <MultisigMigrationProcess />;
};

export default Migration;
