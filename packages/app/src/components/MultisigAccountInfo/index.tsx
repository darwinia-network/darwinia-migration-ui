import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import { useWallet } from "@darwinia/app-providers";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import Identicon from "@polkadot/react-identicon";
import copyIcon from "../../assets/images/copy.svg";
import { Button, CheckboxGroup, Input, ModalEnhanced, SlideDownUp, Tooltip } from "@darwinia/ui";
import caretIcon from "../../assets/images/caret-down.svg";
import JazzIcon from "../JazzIcon";
import { Tip } from "../MigrationForm";
import helpIcon from "../../assets/images/help.svg";
import trashIcon from "../../assets/images/trash-bin.svg";
import { isValidNumber, isEthereumAddress } from "@darwinia/app-utils";

const MultisigAccountInfo = () => {
  const { t } = useAppTranslation();
  const { injectedAccounts } = useWallet();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const address = params.get("address");
  const members = (params.get("who") ?? "").split(",");
  const name = params.get("name");
  const threshold = params.get("threshold");
  const [isMemberSectionVisible, setMemberSectionVisible] = useState<boolean>(true);
  const [isMigrateModalVisible, setMigrationModalVisible] = useState<boolean>(false);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [activeDestinationTab, setActiveDestinationTab] = useState<number>(1);
  const [isAttentionModalVisible, setAttentionModalVisibility] = useState<boolean>(false);
  const [isConfirmationModalVisible, setConfirmationModalVisibility] = useState<boolean>(false);
  const [checkedTips, setCheckedTips] = useState<Tip[]>([]);
  const { selectedNetwork, onInitMigration } = useWallet();
  const [isProcessingMigration, setProcessingMigration] = useState<boolean>(false);
  const [memberAddresses, setMemberAddresses] = useState<{ address: string; id: number }[]>([
    { id: new Date().getTime(), address: "" },
  ]);
  const [newAccountThreshold, setNewAccountThreshold] = useState<string>("");
  const [newMultisigAccountAddress, setNewMultisigAccountAddress] = useState<string>("");

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

  const onCloseModal = () => {
    setMigrationModalVisible(false);
  };

  const onContinueMigration = () => {
    setMigrationModalVisible(false);
    setAttentionModalVisibility(true);
  };

  const generateMultisigAccount = () => {
    const dummyAddress = "0xDeA37A59acB4F407980Ea347ab351697E7102ae0";
    setNewMultisigAccountAddress(dummyAddress);
    console.log("call the smart contract");
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
      return destinationAddress.length === 0;
    } else {
      const isValidThreshold = isValidNumber(newAccountThreshold);
      const isValidMultisigAddress = isEthereumAddress(newMultisigAccountAddress);
      return !isValidThreshold || !isValidMultisigAddress;
    }
  };

  const onCloseConfirmationModal = () => {
    setConfirmationModalVisibility(false);
  };

  const onConfirmAndMigrate = async () => {
    if (!address) {
      return;
    }
    try {
      setProcessingMigration(true);
      const destination = activeDestinationTab === 1 ? destinationAddress : newMultisigAccountAddress;
      onInitMigration(address, destination, (isSuccessful) => {
        setProcessingMigration(isSuccessful);
      });
    } catch (e) {
      setProcessingMigration(false);
    }
  };

  const onDeleteMemberAddress = (index: number) => {
    const addresses = [...memberAddresses];
    addresses.splice(index, 1);
    setMemberAddresses(addresses);
  };

  const onMemberAddressChanged = (index: number, value: string) => {
    const members = [...memberAddresses];
    members[index].address = value;
    setMemberAddresses(() => members);
    //TODO delete this
    generateMultisigAccount();
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

  return (
    <div className={"flex flex-col gap-[20px]"}>
      <div className={"flex py-[10px] border border-primary items-center gap-[10px] px-[15px]"}>
        <div>One more step! Please click </div>
        <div>
          <Button>Deploy</Button>
        </div>
        <div>to complete the migration of the multisig account.</div>
      </div>
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
                <img className={"clickable shrink-0"} src={copyIcon} alt="image" />
              </div>
            </div>
            <Button onClick={onShowMigrateModal}>{t(localeKeys.migrate)}</Button>
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
                    (account) => account.address.toLowerCase() === member.toLowerCase()
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
        onClose={onCloseModal}
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
