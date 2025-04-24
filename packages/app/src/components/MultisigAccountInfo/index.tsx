import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import { useStorage, useWallet } from "@darwinia/app-providers";
import { useEffect, useRef, useState } from "react";
import Identicon from "@polkadot/react-identicon";
import copyIcon from "../../assets/images/copy.svg";
import { Button, CheckboxGroup, Input, ModalEnhanced, notification, SlideDownUp, Tooltip } from "@darwinia/ui";
import caretIcon from "../../assets/images/caret-down.svg";
import JazzIcon from "../JazzIcon";
import { Tip } from "../MigrationForm";
import helpIcon from "../../assets/images/help.svg";
import trashIcon from "../../assets/images/trash-bin.svg";
import { isValidNumber, isEthereumAddress, getPublicKey, convertToSS58, setStore, getStore } from "@darwinia/app-utils";
import { BigNumber as EthersBigNumber } from "ethers";
import { DestinationType, MultisigDestinationParams } from "@darwinia/app-types";
import { AccountBasicInfo } from "../../pages/MultisigAccountMigrationSummary";

interface MultisigMemberAddress {
  address: string;
  id: number;
}

interface Props {
  isWaitingToDeploy: boolean;
  isSuccessfullyMigrated: boolean;
  isMigrationInitialized: boolean;
  accountBasicInfo?: AccountBasicInfo;
  onDeploymentSuccessful: () => void;
}

const MultisigAccountInfo = ({
  isWaitingToDeploy,
  isSuccessfullyMigrated,
  isMigrationInitialized,
  accountBasicInfo,
  onDeploymentSuccessful,
}: Props) => {
  const { t } = useAppTranslation();
  const {
    injectedAccounts,
    multisigContract,
    selectedNetwork,
    onInitMultisigMigration,
    connectEthereumWallet,
    selectedEthereumAccount,
    isCorrectEthereumChain,
    setTransactionStatus,
  } = useWallet();
  const { checkEVMAccountStatus, isAccountFree } = useStorage();

  const [isMemberSectionVisible, setMemberSectionVisible] = useState<boolean>(true);
  const [isMigrateModalVisible, setMigrationModalVisible] = useState<boolean>(false);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [activeDestinationTab, setActiveDestinationTab] = useState<number>(1);
  const [isAttentionModalVisible, setAttentionModalVisibility] = useState<boolean>(false);
  const [isConfirmationModalVisible, setConfirmationModalVisibility] = useState<boolean>(false);
  const [checkedTips, setCheckedTips] = useState<Tip[]>([]);
  const [isProcessingMigration, setProcessingMigration] = useState<boolean>(false);
  /* Member addresses will ways be one item less since the first address will always be chosen
   * automatically on MetaMask */
  const [memberAddresses, setMemberAddresses] = useState<MultisigMemberAddress[]>([
    { id: new Date().getTime(), address: "" },
  ]);
  //stores sorted members account address
  const allMembersRef = useRef<string[]>([]);
  const [newAccountThreshold, setNewAccountThreshold] = useState<string>(
    accountBasicInfo?.destinationThreshold ? `${accountBasicInfo?.destinationThreshold}` : "",
  );
  const [newMultisigAccountAddress, setNewMultisigAccountAddress] = useState<string>("");
  const [isIsGeneratingMultisigAccount, setIsGeneratingMultisigAccount] = useState<boolean>(false);
  const deployButtonRef = useRef<HTMLButtonElement>(null);
  const shouldAutoClickDeployButton = useRef<boolean>(false);
  const [isJustDeployed, setIsJustDeployed] = useState<boolean>(false);
  const [isCheckingAccountStatus, setCheckingAccountStatus] = useState<boolean>(false);

  useEffect(() => {
    setIsJustDeployed(isSuccessfullyMigrated);
  }, [isSuccessfullyMigrated]);

  const destinationTabs = [
    {
      id: 1,
      label: t(localeKeys.general),
    },
    {
      id: 2,
      label: t(localeKeys.multisig),
    },
  ];

  const toggleMemberSections = () => {
    setMemberSectionVisible((isVisible) => !isVisible);
  };

  const onShowMigrateModal = () => {
    setMigrationModalVisible(true);
  };

  const onCloseMigrationModal = () => {
    setMigrationModalVisible(false);
    // reset form
    setMemberAddresses([{ id: new Date().getTime(), address: "" }]);
    setNewAccountThreshold("");
    setNewMultisigAccountAddress("");
    setDestinationAddress("");
    setActiveDestinationTab(1);
  };

  const onContinueMigration = () => {
    if (activeDestinationTab === 1) {
      setMigrationModalVisible(false);
      setAttentionModalVisibility(true);
    } else {
      setMigrationModalVisible(false);
      setConfirmationModalVisibility(true);
    }
  };

  const generateMultisigAccount = async (
    members: MultisigMemberAddress[],
    selectedEthereumAccount: string,
    multisigSubstrateAddress: string,
    destinationThreshold: string,
  ) => {
    try {
      setIsGeneratingMultisigAccount(true);
      const publicKey = getPublicKey(multisigSubstrateAddress);
      const memberAddresses = members.map((item) => item.address);

      memberAddresses.unshift(selectedEthereumAccount);
      const sortedMembers = memberAddresses.sort();
      const thresholdNumber = EthersBigNumber.from(destinationThreshold);
      const multisigAddress = await multisigContract?.computeAddress(publicKey, sortedMembers, thresholdNumber);
      if (!multisigAddress) {
        console.log("multisig account not generated");
        return;
      }
      allMembersRef.current = [...sortedMembers];
      setNewMultisigAccountAddress(multisigAddress);
      setIsGeneratingMultisigAccount(false);
    } catch (e) {
      setNewMultisigAccountAddress("");
      allMembersRef.current = [];
      setIsGeneratingMultisigAccount(false);
      console.log(e);
    }
  };

  const onAttentionTipChecked = (checkedTip: Tip, allCheckedTips: Tip[]) => {
    setCheckedTips(allCheckedTips);
  };

  const attentionTips: Tip[] = [
    {
      id: 1,
      title: t(localeKeys.iamMigratingFromOneDarwiniaToTwo),
    },
    {
      id: 2,
      title: t(localeKeys.iHaveConfirmedIsNewAddress),
    },
    {
      id: 3,
      title: t(localeKeys.iHavePrivateKeys),
    },
    {
      id: 4,
      title: t(localeKeys.evmAccountNotExchange),
    },
    {
      id: 5,
      title: t(localeKeys.evmAccountSafe, { link: "https://metamask.io/" }),
    },
  ];

  const onCloseAttentionModal = () => {
    setAttentionModalVisibility(false);
    setCheckedTips([]);
  };

  const getTipOption = (option: Tip) => {
    return <div dangerouslySetInnerHTML={{ __html: option.title }} />;
  };

  const onTermsAgreeing = () => {
    setAttentionModalVisibility(false);
    setConfirmationModalVisibility(true);
  };

  const isContinueButtonDisabled = () => {
    if (activeDestinationTab === 1) {
      return destinationAddress.trim().length === 0 || isCheckingAccountStatus || !isAccountFree;
    } else {
      const isValidThreshold = isValidNumber(newAccountThreshold);
      const isValidMultisigAddress = isEthereumAddress(newMultisigAccountAddress);
      return !isValidThreshold || !isValidMultisigAddress || isIsGeneratingMultisigAccount || !isCorrectEthereumChain;
    }
  };

  const isContinueButtonLoading = () => {
    if (activeDestinationTab === 1) {
      return isCheckingAccountStatus;
    } else {
      return isIsGeneratingMultisigAccount;
    }
  };

  const onCloseConfirmationModal = () => {
    setConfirmationModalVisibility(false);
  };

  const onConfirmAndMigrate = async () => {
    if (
      !accountBasicInfo ||
      !accountBasicInfo?.address ||
      !accountBasicInfo?.initializer ||
      !accountBasicInfo?.threshold
    ) {
      return;
    }
    try {
      const initializer = accountBasicInfo.initializer;
      const sourceMembers = accountBasicInfo?.members ?? [];
      const sourceThreshold = accountBasicInfo.threshold.toString();
      setProcessingMigration(true);
      const isMigratingToGeneralAccount = activeDestinationTab === 1;
      const destination = isMigratingToGeneralAccount ? destinationAddress : newMultisigAccountAddress;
      const type: DestinationType = isMigratingToGeneralAccount ? "General Account" : "Multisig Account";

      const otherAccounts = sourceMembers.filter((account) => account !== initializer);
      const multisigDestinationParams: MultisigDestinationParams = {
        address: newMultisigAccountAddress,
        threshold: Number(newAccountThreshold ?? 0),
        members: allMembersRef.current,
      };

      const params = type === "General Account" ? null : multisigDestinationParams;

      onInitMultisigMigration(
        destination,
        initializer,
        initializer,
        otherAccounts,
        sourceThreshold,
        params,
        (isSuccessful) => {
          setProcessingMigration(false);
          if (isSuccessful) {
            setConfirmationModalVisibility(false);
          } else {
            notification.error({
              message: <div>{t(localeKeys.migrationFailed)}</div>,
            });
          }
        },
      );
    } catch (e) {
      console.log(e);
      setProcessingMigration(false);
    }
  };

  const onDeleteMemberAddress = (index: number) => {
    const addresses = [...memberAddresses];
    addresses.splice(index, 1);
    setMemberAddresses(addresses);

    const members = [...addresses].filter((item) => item.address !== "");
    /* Member addresses will ways be one item less since the first address will always be chosen
     * automatically on MetaMask */
    const newThreshold = newAccountThreshold.trim() === "" ? 1 : Number(newAccountThreshold.trim());
    if (
      newThreshold >= 2 &&
      selectedEthereumAccount &&
      isCorrectEthereumChain &&
      accountBasicInfo?.address &&
      members.length >= newThreshold - 1
    ) {
      generateMultisigAccount(members, selectedEthereumAccount, accountBasicInfo?.address, `${newThreshold}`);
    } else {
      setNewMultisigAccountAddress("");
    }
  };

  useEffect(() => {
    if (isCorrectEthereumChain && shouldAutoClickDeployButton.current) {
      deployButtonRef.current?.click();
    }
  }, [isCorrectEthereumChain, shouldAutoClickDeployButton.current]);

  /*If the account is migrated to a general account, it won't need to be deployed*/
  const onDeploy = async () => {
    try {
      if (!isCorrectEthereumChain) {
        shouldAutoClickDeployButton.current = true;
        connectEthereumWallet();
        return;
      }
      setIsJustDeployed(false);
      shouldAutoClickDeployButton.current = false;
      setTransactionStatus(true);
      const publicKey = getPublicKey(accountBasicInfo?.address ?? "");
      const destinationMembersProps = accountBasicInfo?.destinationMembers ?? [];
      const ethereumMemberAddresses =
        destinationMembersProps.length > 0
          ? destinationMembersProps
          : memberAddresses.map((item) => item.address).filter((item) => item.trim() !== "");

      if (selectedEthereumAccount && destinationMembersProps.length === 0) {
        /* the destinationMembers don't come from the shared URL, add the selectedEthereumAccount into the list
         * since the user added this account when connecting to MetaMask */
        ethereumMemberAddresses.unshift(selectedEthereumAccount);
      }
      const sortedMembers = [...ethereumMemberAddresses].sort();
      const destinationThreshold =
        typeof accountBasicInfo?.destinationThreshold !== "undefined"
          ? accountBasicInfo?.destinationThreshold
          : newAccountThreshold;
      console.log("sortedMembers", sortedMembers);
      console.log("destinationThreshold", destinationThreshold);
      console.log("publicKey", publicKey);
      const thresholdNumber = EthersBigNumber.from(destinationThreshold);
      const response = await multisigContract?.deploy(publicKey, sortedMembers, thresholdNumber);
      const transactionReceipt = await response.wait(1);
      console.log("deploymentResult", transactionReceipt);
      setIsJustDeployed(true);
      setTransactionStatus(false);
      onDeploymentSuccessful();
    } catch (e) {
      setIsJustDeployed(false);
      setTransactionStatus(false);
      console.log(e);
    }
  };

  const onMemberAddressChanged = (index: number, value: string) => {
    const members = [...memberAddresses];
    members[index].address = value;
    setMemberAddresses(() => members);
    const exactMembers = [...members].filter((item) => item.address !== "");
    /* Member addresses will ways be one item less since the first address will always be chosen
     * automatically on MetaMask */
    const newThreshold = newAccountThreshold.trim() === "" ? 1 : Number(newAccountThreshold.trim());
    if (
      newThreshold >= 2 &&
      selectedEthereumAccount &&
      isCorrectEthereumChain &&
      accountBasicInfo?.address &&
      exactMembers.length >= newThreshold - 1
    ) {
      generateMultisigAccount(exactMembers, selectedEthereumAccount, accountBasicInfo?.address, `${newThreshold}`);
    } else {
      setNewMultisigAccountAddress("");
    }
  };

  const onAddNewMemberAddress = () => {
    setMemberAddresses((old) => {
      return [
        ...old,
        {
          id: new Date().getTime(),
          address: "",
        },
      ];
    });
  };

  const generateShareLink = async () => {
    try {
      const link = location.href;
      await navigator.clipboard.writeText(link);
      notification.success({
        message: <div>Link copied</div>,
      });
    } catch (e) {
      //ignore
    }
  };

  const initEthereumWalletConnection = () => {
    connectEthereumWallet();
  };

  const onDestinationThresholdChanged = (value: string) => {
    setNewAccountThreshold(value);
    const members = [...memberAddresses].filter((item) => item.address !== "");
    /* Member addresses will ways be one item less since the first address will always be chosen
     * automatically on MetaMask */
    const thresholdValue = value.trim() === "" ? 1 : Number(value.trim());
    if (
      thresholdValue >= 2 &&
      selectedEthereumAccount &&
      isCorrectEthereumChain &&
      accountBasicInfo?.address &&
      members.length >= thresholdValue - 1
    ) {
      generateMultisigAccount(members, selectedEthereumAccount, accountBasicInfo?.address, `${thresholdValue}`);
    } else {
      setNewMultisigAccountAddress("");
    }
  };

  const onDestinationAddressChanged = async (address: string) => {
    try {
      setDestinationAddress(address);
      setCheckingAccountStatus(true);
      await checkEVMAccountStatus(address);
      setCheckingAccountStatus(false);
    } catch (e) {
      //ignore
    }
  };

  return (
    <div className={"flex flex-col gap-[20px]"}>
      {/*one more step to deploy*/}
      {isWaitingToDeploy && !isJustDeployed && (
        <div className={"flex py-[10px] border border-primary items-center gap-[10px] px-[15px]"}>
          <div>{t(localeKeys.oneMoreStep)}</div>
          <div className={"px-[5px]"}>
            <Button
              ref={deployButtonRef}
              onClick={() => {
                onDeploy();
              }}
            >
              {t(localeKeys.deploy)}
            </Button>
          </div>
          <div>{t(localeKeys.toCompleteMigration)}</div>
        </div>
      )}
      {/*account migrated successfully*/}
      {(isSuccessfullyMigrated || isJustDeployed) && (
        <div className={"flex py-[10px] border border-primary items-center gap-[10px] px-[15px]"}>
          <div
            dangerouslySetInnerHTML={{
              __html: t(localeKeys.multisigMigrationSuccessful, {
                link: "https://ipfs.io/ipfs/QmfRD4GuqZobNi2NT2C77a3UTQ452ffwstr4fjEJixUgjf/#/wallets",
              }),
            }}
          />
        </div>
      )}
      <div className={"card"}>
        <div className={"flex flex-col"}>
          <div className={"flex justify-between items-center border-b divider pb-[20px]"}>
            <div className={"flex items-center gap-[20px] flex-ellipsis"}>
              <Identicon
                value={accountBasicInfo?.address}
                size={30}
                className={"rounded-full self-start bg-white shrink-0"}
                theme={"polkadot"}
              />
              <div className={"flex gap-[5px]"}>
                <div>{accountBasicInfo?.name}</div>
                <div className={"rounded-[30px] text-12 inline-block py-[4px] px-[5px] bg-[rgba(255,0,131,0.5)]"}>
                  {t(localeKeys.multisig)}
                </div>
              </div>
              <div className={"flex items-center gap-[5px]"}>
                <div>{accountBasicInfo?.address}</div>
                <img onClick={generateShareLink} className={"clickable shrink-0"} src={copyIcon} alt="image" />
              </div>
            </div>
            {!isMigrationInitialized && <Button onClick={onShowMigrateModal}>{t(localeKeys.migrate)}</Button>}
          </div>
          <div onClick={toggleMemberSections} className={"flex gap-[20px] items-center mt-[20px]"}>
            <div className={"flex gap-[10px]"}>
              <div>{t(localeKeys.threshold)}</div>
              <div>{accountBasicInfo?.threshold}</div>
            </div>
            <div className={"flex gap-[10px]"}>
              <div>{t(localeKeys.members)}</div>
              <div>{accountBasicInfo?.members.length}</div>
            </div>
            <div>
              <img
                className={`w-[20px] clickable transition ${isMemberSectionVisible ? "rotate-180" : "rotate-0"} `}
                src={caretIcon}
                alt="caretIcon"
              />
            </div>
          </div>
          <div>
            <SlideDownUp isVisible={isMemberSectionVisible}>
              <div className={"pt-[20px]"}>
                {accountBasicInfo?.members.map((member, index) => {
                  const isMyAccount = !!injectedAccounts?.find(
                    (account) =>
                      convertToSS58(account.address, selectedNetwork?.prefix ?? 18).toLowerCase() ===
                      member.toLowerCase(),
                  );
                  return (
                    <div
                      className={"flex flex-ellipsis border-b divider bg-black px-[10px] py-[12px]"}
                      key={`${member}-${index}`}
                    >
                      <div className={"min-w-[170px]"}>
                        {isMyAccount ? t(localeKeys.memberYou) : t(localeKeys.member)}
                      </div>
                      <div>{member}</div>
                    </div>
                  );
                })}
              </div>
            </SlideDownUp>
          </div>
        </div>
      </div>
      {/*Migration modal*/}
      <ModalEnhanced
        confirmText={t(localeKeys.continue)}
        onConfirm={onContinueMigration}
        confirmDisabled={isContinueButtonDisabled()}
        isVisible={isMigrateModalVisible}
        onClose={onCloseMigrationModal}
        modalTitle={t(localeKeys.migration)}
        confirmLoading={isContinueButtonLoading()}
      >
        <div className={"flex flex-col gap-[20px] dw-custom-scrollbar max-h-[500px]"}>
          <div className={"flex flex-col gap-[10px] border-b divider pb-[20px]"}>
            <div>{t(localeKeys.fromSubstrateMultisig)}</div>
            <div className={"flex flex-ellipsis items-center gap-[10px] border border-white py-[7px] px-[10px]"}>
              <Identicon
                value={accountBasicInfo?.address}
                size={26}
                className={"rounded-full bg-white shrink-0"}
                theme={"polkadot"}
              />
              <div>{accountBasicInfo?.address}</div>
            </div>
          </div>
          <div className={"flex flex-col gap-[10px]"}>
            <div>{t(localeKeys.toEVMAccountDarwinia)}</div>
            <div>
              <div className={"flex border border-primary"}>
                {destinationTabs.map((tab) => {
                  const tabBg = tab.id === activeDestinationTab ? `bg-primary` : "";
                  return (
                    <div
                      onClick={() => {
                        setActiveDestinationTab(tab.id);
                      }}
                      className={`flex-1 text-center py-[5px] cursor-pointer ${tabBg}`}
                      key={tab.id}
                    >
                      {tab.label}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              {/*General tab*/}
              <div
                className={`flex flex-col gap-[10px] border-b divider p-[10px] ${
                  activeDestinationTab === 1 ? "" : "hidden"
                }`}
              >
                <div className={"flex items-center border-white border px-[10px] gap-[10px]"}>
                  <div className={"shrink-0"}>
                    <JazzIcon address={destinationAddress} size={26} />
                  </div>
                  <input
                    value={destinationAddress}
                    onChange={(e) => {
                      onDestinationAddressChanged(e.target.value);
                    }}
                    placeholder={t(localeKeys.evmAccountFormat)}
                    className={"custom-input h-[40px]"}
                  />
                </div>
                {!isAccountFree && destinationAddress.trim().length > 0 && (
                  <div className={"text-primary text-10"}>{t(localeKeys.evmAccountNotFree)}</div>
                )}
                <div>{t(localeKeys.migrationNotice)}</div>
              </div>
              {/*Multisig tab*/}
              <div
                className={`flex flex-col gap-[10px] border-b divider ${activeDestinationTab === 2 ? "" : "hidden"}`}
              >
                <div className={"flex flex-col gap-[10px] bg-black p-[10px]"}>
                  <div className={"flex flex-col gap-[10px]"}>
                    <div className={"flex items-center gap-[6px]"}>
                      <div>{t(localeKeys.threshold)}</div>
                      <Tooltip message={t(localeKeys.multisigThresholdTip)}>
                        <img className={"w-[16px]"} src={helpIcon} alt="image" />
                      </Tooltip>
                    </div>
                    <Input
                      value={newAccountThreshold}
                      placeholder={""}
                      onChange={(e) => {
                        onDestinationThresholdChanged(e.target.value);
                      }}
                      leftIcon={null}
                    />
                  </div>

                  <div className={"flex flex-col gap-[10px]"}>
                    <div className={"flex items-center gap-[6px]"}>
                      <div>{t(localeKeys.membersAddress)}</div>
                    </div>
                    <div className={"flex flex-col gap-[10px]"}>
                      <div>
                        {!isCorrectEthereumChain ? (
                          <Button className={"w-full"} onClick={initEthereumWalletConnection}>
                            Connect Wallet
                          </Button>
                        ) : (
                          <div className={"border border-gray bg-[rgba(255,255,255,0.2)] px-[10px] py-[8px]"}>
                            {selectedEthereumAccount}
                          </div>
                        )}
                      </div>
                      {memberAddresses.map((item, index) => {
                        return (
                          <div key={`${item.id}-${index}`} className={"flex gap-[12px] items-center"}>
                            <div className={"flex-1"}>
                              <Input
                                onChange={(event) => {
                                  onMemberAddressChanged(index, event.target.value);
                                }}
                                value={item.address}
                                placeholder={t(localeKeys.memberAddress)}
                                leftIcon={null}
                              />
                            </div>
                            <img
                              onClick={() => {
                                onDeleteMemberAddress(index);
                              }}
                              className={"w-[21px] h-[21px] cursor-pointer"}
                              src={trashIcon}
                              alt="image"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <Button onClick={onAddNewMemberAddress} btnType={"secondary"}>
                        {t(localeKeys.addMembers)}
                      </Button>
                    </div>
                  </div>
                </div>
                <div
                  className={"bg-[rgba(255,255,255,0.2)] flex-ellipsis flex items-center gap-[10px] py-[7px] px-[10px]"}
                >
                  <div className={"w-[26px] shrink-0"}>
                    <JazzIcon address={newMultisigAccountAddress} size={26} />
                  </div>
                  <div>{newMultisigAccountAddress}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalEnhanced>

      {/*terms of service*/}
      <ModalEnhanced
        isVisible={isAttentionModalVisible}
        onClose={onCloseAttentionModal}
        modalTitle={t(localeKeys.attention)}
        isCancellable={true}
        onConfirm={onTermsAgreeing}
        confirmText={t(localeKeys.agreeAndContinue)}
        confirmDisabled={checkedTips.length < attentionTips.length}
        onCancel={onCloseAttentionModal}
        cancelText={t(localeKeys.cancel)}
      >
        <div>
          <CheckboxGroup
            className={"flex-start"}
            render={getTipOption}
            onChange={onAttentionTipChecked}
            selectedOptions={checkedTips}
            options={attentionTips}
          />
        </div>
      </ModalEnhanced>

      {/*Migration confirmation*/}
      <ModalEnhanced
        isVisible={isConfirmationModalVisible}
        onClose={onCloseConfirmationModal}
        modalTitle={t(localeKeys.migrationConfirmation)}
        confirmText={t(localeKeys.confirmAndMigrate)}
        onConfirm={onConfirmAndMigrate}
        onCancel={onCloseConfirmationModal}
        cancelText={t(localeKeys.cancel)}
        isLoading={isProcessingMigration}
        isCancellable={true}
      >
        <div className={"flex flex-col gap-[20px] pb-[20px] divider border-b"}>
          {/*Origin*/}
          <div className={"flex flex-col gap-[10px]"}>
            <div className={"text-12-bold"}>
              {t(localeKeys.fromTheSubstrateAccount, { name: selectedNetwork?.name })}
            </div>
            <div className={"bg-[rgba(255,255,255,0.2)] flex-ellipsis flex items-center gap-[10px] py-[7px] px-[10px]"}>
              <Identicon
                value={accountBasicInfo?.address}
                size={26}
                className={"rounded-full bg-white shrink-0"}
                theme={"polkadot"}
              />
              <div>{accountBasicInfo?.address}</div>
            </div>
          </div>
          {/*Destination*/}
          <div className={"flex flex-col gap-[10px]"}>
            <div className={"text-12-bold"}>{t(localeKeys.toEVMAccount, { name: selectedNetwork?.name })}</div>
            <div className={"bg-[rgba(255,255,255,0.2)] flex-ellipsis flex items-center gap-[10px] py-[7px] px-[10px]"}>
              <div className={"w-[26px] shrink-0"}>
                <JazzIcon
                  address={activeDestinationTab === 1 ? destinationAddress : newMultisigAccountAddress}
                  size={26}
                />
              </div>
              <div>{activeDestinationTab === 1 ? destinationAddress : newMultisigAccountAddress}</div>
            </div>
          </div>
        </div>
      </ModalEnhanced>
    </div>
  );
};

export default MultisigAccountInfo;
