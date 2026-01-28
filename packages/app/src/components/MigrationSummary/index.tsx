import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import { useStorage, useWallet } from "@darwinia/app-providers";
import { useEffect, useRef, useState } from "react";
import TokensBalanceSummary from "../TokensBalanceSummary";
import { AssetDistribution } from "@darwinia/app-types";

interface Props {
  isCheckingMigrationStatus?: boolean;
  accountAddress?: string | null;
}

const MigrationSummary = ({ isCheckingMigrationStatus, accountAddress }: Props) => {
  const { t } = useAppTranslation();
  const { selectedNetwork, setTransactionStatus, getAccountBalance, apiPromise, currentBlock, isMultisig } =
    useWallet();
  const { migrationAssetDistribution, isLoadingLedger } = useStorage();
  const [isLoadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [multisigBalance, setMultisigBalance] = useState<AssetDistribution>();
  const isInitializingLocalAccountsRef = useRef<boolean>(true);

  useEffect(() => {
    setTransactionStatus(!!isLoadingLedger || !!isCheckingMigrationStatus || isLoadingBalance);
  }, [isLoadingLedger, isCheckingMigrationStatus, isLoadingBalance]);

  useEffect(() => {
    return () => {
      setTransactionStatus(false);
    };
  }, []);

  useEffect(() => {
    if (!apiPromise || !currentBlock || !isInitializingLocalAccountsRef.current) {
      return;
    }
    isInitializingLocalAccountsRef.current = false;
    const initBalance = async () => {
      if (accountAddress) {
        setLoadingBalance(true);
        const asset = await getAccountBalance(accountAddress);
        setMultisigBalance(asset);
        setLoadingBalance(false);
      }
    };
    initBalance().catch((e) => {
      console.log(e);
      setLoadingBalance(false);
    });
  }, [accountAddress, apiPromise, currentBlock]);

  return (
    <div className={"card flex gap-[20px] flex-col"}>
      <TokensBalanceSummary asset={accountAddress ? multisigBalance : migrationAssetDistribution} />
      {!isMultisig && <div className={"text-12"}>{t(localeKeys.migrationSummaryInfo)}</div>}
    </div>
  );
};

export default MigrationSummary;
