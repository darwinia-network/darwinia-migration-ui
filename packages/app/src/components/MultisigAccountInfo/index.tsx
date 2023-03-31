import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import { useWallet } from "@darwinia/app-providers";
import { useLocation } from "react-router-dom";
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
import { DestinationInfo, DestinationType, MultisigDestinationParams } from "@darwinia/app-types";

interface MultisigMemberAddress {
  address: string;
  id: number;
}

interface Props {
  isWaitingToDeploy: boolean;
  isSuccessfullyMigrated: boolean;
}

const MultisigAccountInfo = ({ isWaitingToDeploy, isSuccessfullyMigrated }: Props) => {
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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const address = convertToSS58(params.get("address") ?? "", selectedNetwork?.prefix ?? 18);
  const initializer = convertToSS58(params.get("initializer") ?? "", selectedNetwork?.prefix ?? 18);
  const members = (params.get("who") ?? "")
    .split(",")
    .map((address) => convertToSS58(address, selectedNetwork?.prefix ?? 18));
  const name = params.get("name");
  const threshold = params.get("threshold");
  const destinationMembers = (params.get("destinationMembers") ?? "").split(",").filter((item) => item.trim() !== "");
  const destinationType: DestinationType = destinationMembers.length > 0 ? "Multisig Account" : "General Account";
  const destinationThreshold = params.get("destinationThreshold");
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
  const [newAccountThreshold, setNewAccountThreshold] = useState<string>(destinationThreshold ?? "");
  const [newMultisigAccountAddress, setNewMultisigAccountAddress] = useState<string>("");
  const [isIsGeneratingMultisigAccount, setIsGeneratingMultisigAccount] = useState<boolean>(false);

  const canMigrate = !isWaitingToDeploy && !isSuccessfullyMigrated;

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
    setMigrationModalVisible(false);
    setAttentionModalVisibility(true);
  };

  const generateMultisigAccount = async (
    members: MultisigMemberAddress[],
    selectedEthereumAccount: string,
    multisigSubstrateAddress: string
  ) => {
    try {
      setIsGeneratingMultisigAccount(true);
      const publicKey = getPublicKey(multisigSubstrateAddress);
      const memberAddresses = members.map((item) => item.address);

      memberAddresses.unshift(selectedEthereumAccount);
      const sortedMembers = memberAddresses.sort();
      const thresholdNumber = EthersBigNumber.from(newAccountThreshold);
      const multisigAddress = await multisigContract?.computeAddress(publicKey, sortedMembers, thresholdNumber);
      if (!multisigAddress) {
        console.log("multisig account not generated");
        return;
      }
      allMembersRef.current = [...sortedMembers];
      setNewMultisigAccountAddress(multisigAddress);
      setIsGeneratingMultisigAccount(false);
    } catch (e) {
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
      return destinationAddress.length === 0 || isIsGeneratingMultisigAccount;
    } else {
      const isValidThreshold = isValidNumber(newAccountThreshold);
      const isValidMultisigAddress = isEthereumAddress(newMultisigAccountAddress);
      return !isValidThreshold || !isValidMultisigAddress || isIsGeneratingMultisigAccount || !isCorrectEthereumChain;
    }
  };

  const onCloseConfirmationModal = () => {
    setConfirmationModalVisibility(false);
  };

  const onConfirmAndMigrate = async () => {
    if (!address || !initializer || !threshold) {
      return;
    }
    try {
      setProcessingMigration(true);
      const isMigratingToGeneralAccount = activeDestinationTab === 1;
      const destination = isMigratingToGeneralAccount ? destinationAddress : newMultisigAccountAddress;
      const type: DestinationType = isMigratingToGeneralAccount ? "General Account" : "Multisig Account";

      const urlParams = new URLSearchParams(location.search);
      urlParams.set("destination", destination);

      if (!isMigratingToGeneralAccount) {
        urlParams.set("destinationThreshold", newAccountThreshold);
        urlParams.set("destinationMembers", allMembersRef.current.join(","));
      } else {
        urlParams.delete("destinationThreshold");
        urlParams.delete("destinationMembers");
      }

      const oldData = getStore("destinationInfo") ?? {};
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      oldData[address] = {
        threshold: Number(newAccountThreshold),
        address: destination,
        type: type,
        members: allMembersRef.current,
      };

      setStore("destinationInfo", oldData);

      window.history.pushState({}, "", `/#${location.pathname}?${urlParams.toString()}`);

      const otherAccounts = members.filter((account) => account !== initializer);
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
        threshold,
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
        }
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
  };

  const onDeploy = async () => {
    try {
      setTransactionStatus(true);
      const publicKey = getPublicKey(address);
      const ethereumMemberAddresses =
        destinationMembers.length > 0 ? destinationMembers : memberAddresses.map((item) => item.address);

      if (selectedEthereumAccount && destinationMembers.length === 0) {
        ethereumMemberAddresses.unshift(selectedEthereumAccount);
      }
      const sortedMembers = ethereumMemberAddresses.sort();
      const thresholdNumber = EthersBigNumber.from(newAccountThreshold);
      console.log("sortedMembers", sortedMembers);
      const response = await multisigContract?.deploy(publicKey, sortedMembers, thresholdNumber);
      const transactionReceipt = response.wait(1);
      console.log("deploymentResult", transactionReceipt);
      setTransactionStatus(false);
    } catch (e) {
      setTransactionStatus(false);
      console.log(e);
    }
  };

  const onMemberAddressChanged = (index: number, value: string) => {
    const members = [...memberAddresses];
    members[index].address = value;
    setMemberAddresses(() => members);
    /* Member addresses will ways be one item less since the first address will always be chosen
     * automatically on MetaMask */
    if (
      selectedEthereumAccount &&
      isCorrectEthereumChain &&
      address &&
      members.length >= Number(newAccountThreshold ?? 1) - 1
    ) {
      generateMultisigAccount(members, selectedEthereumAccount, address);
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

  const generateShareLink = () => {
    console.log("generate share link");
  };

  const initEthereumWalletConnection = () => {
    connectEthereumWallet();
  };

  return (
    <div className={"flex flex-col gap-[20px]"}>
      {/*one more step to deploy*/}
      {isWaitingToDeploy && (
        <div className={"flex py-[10px] border border-primary items-center gap-[10px] px-[15px]"}>
          <div>{t(localeKeys.oneMoreStep)}</div>
          <div className={"px-[5px]"}>
            <Button
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
      {isSuccessfullyMigrated && (
        <div className={"flex py-[10px] border border-primary items-center gap-[10px] px-[15px]"}>
          <div
            dangerouslySetInnerHTML={{
              __html: t(localeKeys.multisigMigrationSuccessful, { link: "https://www.test.com" }),
            }}
          />
        </div>
      )}
      <div className={"card"}>
        <div className={"flex flex-col"}>
          <div className={"flex justify-between items-center border-b divider pb-[20px]"}>
            <div className={"flex items-center gap-[20px] flex-ellipsis"}>
              <Identicon
                value={address}
                size={30}
                className={"rounded-full self-start bg-white shrink-0"}
                theme={"polkadot"}
              />
              <div className={"flex gap-[5px]"}>
                <div>{name}</div>
                <div className={"rounded-[30px] text-12 inline-block py-[4px] px-[5px] bg-[rgba(255,0,131,0.5)]"}>
                  {t(localeKeys.multisig)}
                </div>
              </div>
              <div className={"flex items-center gap-[5px]"}>
                <div>{address}</div>
                <img onClick={generateShareLink} className={"clickable shrink-0"} src={copyIcon} alt="image" />
              </div>
            </div>
            {canMigrate && <Button onClick={onShowMigrateModal}>{t(localeKeys.migrate)}</Button>}
          </div>
          <div onClick={toggleMemberSections} className={"flex gap-[20px] items-center mt-[20px]"}>
            <div className={"flex gap-[10px]"}>
              <div>{t(localeKeys.threshold)}</div>
              <div>{threshold}</div>
            </div>
            <div className={"flex gap-[10px]"}>
              <div>{t(localeKeys.members)}</div>
              <div>{members.length}</div>
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
                {members.map((member, index) => {
                  const isMyAccount = !!injectedAccounts?.find(
                    (account) =>
                      convertToSS58(account.address, selectedNetwork?.prefix ?? 18).toLowerCase() ===
                      member.toLowerCase()
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
      >
        <div className={"flex flex-col gap-[20px] dw-custom-scrollbar max-h-[500px]"}>
          <div className={"flex flex-col gap-[10px] border-b divider pb-[20px]"}>
            <div>{t(localeKeys.fromSubstrateMultisig)}</div>
            <div className={"flex flex-ellipsis items-center gap-[10px] border border-white py-[7px] px-[10px]"}>
              <Identicon value={address} size={26} className={"rounded-full bg-white shrink-0"} theme={"polkadot"} />
              <div>{address}</div>
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
                      setDestinationAddress(e.target.value);
                    }}
                    placeholder={t(localeKeys.evmAccountFormat)}
                    className={"custom-input h-[40px]"}
                  />
                </div>
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
                        setNewAccountThreshold(e.target.value);
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
                        {/*TODO: change this logic accordingly*/}
                        <div
                          onClick={initEthereumWalletConnection}
                          className={"border border-gray bg-[rgba(255,255,255,0.2)] px-[10px] py-[8px]"}
                        >
                          {isCorrectEthereumChain ? selectedEthereumAccount : "Connect Metamask"}
                        </div>
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
              <Identicon value={address} size={26} className={"rounded-full bg-white shrink-0"} theme={"polkadot"} />
              <div>{address}</div>
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
