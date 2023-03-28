import { Tabs, Tab, Tooltip, Button, notification } from "@darwinia/ui";
import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Identicon from "@polkadot/react-identicon";
import BigNumber from "bignumber.js";
import crabIcon from "../../assets/images/crab.svg";
import ringIcon from "../../assets/images/ring.svg";
import cktonIcon from "../../assets/images/ckton.svg";
import ktonIcon from "../../assets/images/kton.svg";
import helpIcon from "../../assets/images/help.svg";
import infoIcon from "../../assets/images/info.svg";
import { useWallet } from "@darwinia/app-providers";
import { convertToSS58, getStore, prettifyNumber, prettifyTooltipNumber } from "@darwinia/app-utils";
import { DarwiniaAccountMigrationMultisig, Destination, DestinationInfo, DestinationType } from "@darwinia/app-types";

interface Props {
  migrationStatus: DarwiniaAccountMigrationMultisig | undefined;
  isWaitingToDeploy: boolean;
}

interface MemberStatus {
  name: string;
  address: string;
  hasApproved: boolean;
}

const MultisigMigrationProgressTabs = ({ migrationStatus, isWaitingToDeploy }: Props) => {
  const { t } = useAppTranslation();
  const [memberAccounts, setMemberAccounts] = useState<MemberStatus[]>([]);
  const location = useLocation();
  const {
    selectedNetwork,
    getAccountPrettyName,
    apiPromise,
    injectedAccounts,
    onApproveMultisigMigration,
    setTransactionStatus,
  } = useWallet();
  const params = new URLSearchParams(location.search);
  const address = convertToSS58(params.get("address") ?? "", selectedNetwork?.prefix ?? 18);
  const members = (params.get("who") ?? "")
    .split(",")
    .map((address) => convertToSS58(address, selectedNetwork?.prefix ?? 18));
  const threshold = params.get("threshold");
  const initializer = convertToSS58(params.get("initializer") ?? "", selectedNetwork?.prefix ?? 18);
  const destinationAddress = params.get("destination");
  const destinationMembers = (params.get("destinationMembers") ?? "").split(",").filter((item) => item.trim() !== "");
  const type = params.get("destinationType") as DestinationType;
  const destinationThreshold = Number(params.get("destinationThreshold"));
  const [haveAllMembersApproved, setHaveAllMembersApproved] = useState<boolean>(false);
  const [destination, setDestination] = useState<Destination>();
  const [recentlyApprovedAddresses, setRecentlyApprovedAddresses] = useState<string[]>([]);

  useEffect(() => {
    if (!apiPromise || !migrationStatus || !location) {
      return;
    }

    const prepareMembers = async () => {
      setMemberAccounts([]);
      let approvedCounter = 0;
      const tempMembers: MemberStatus[] = [];
      for (let i = 0; i < members.length; i++) {
        const address = members[i];
        const account = migrationStatus.members.find((member) => member[0] === address);
        if (account) {
          const hasApproved = account[1] || recentlyApprovedAddresses.includes(account[0]);
          const name = (await getAccountPrettyName(address)) ?? "";
          if (hasApproved) {
            approvedCounter = approvedCounter + 1;
          }
          const status: MemberStatus = {
            address,
            hasApproved,
            name,
          };
          tempMembers.push(status);
        }
      }
      setMemberAccounts([...tempMembers]);

      if (approvedCounter < Number(threshold)) {
        setHaveAllMembersApproved(false);
      } else {
        setHaveAllMembersApproved(true);
      }
    };

    prepareMembers().catch((e) => {
      console.log(e);
    });
  }, [location, apiPromise, migrationStatus, recentlyApprovedAddresses]);

  useEffect(() => {
    if (migrationStatus && location) {
      const destination = migrationStatus.migrateTo;
      const destinationInfo = getStore<DestinationInfo>("destinationInfo");

      if (destinationMembers.length > 0) {
        // this is a shared link
        setDestination({
          type,
          threshold: destinationThreshold,
          address: destinationAddress ?? "",
          members: destinationMembers,
        });
      } else if (destinationInfo && destinationInfo[destination]) {
        const value = destinationInfo[destination];
        const urlParams = new URLSearchParams(location.search);

        //set the URL params accordingly for later use
        urlParams.set("destination", value.address);
        urlParams.set("destinationMembers", value.members.join(","));
        if (value.type === "Multisig Account") {
          urlParams.set("destinationThreshold", `${value.threshold}`);
        }
        urlParams.set("destinationType", value.type);

        window.history.pushState({}, "", `/#${location.pathname}?${urlParams.toString()}`);
        setDestination(value);
      }
    }
  }, [migrationStatus, location]);

  const ringTokenIcon = selectedNetwork?.name === "Crab" ? crabIcon : ringIcon;
  const ktonTokenIcon = selectedNetwork?.name === "Crab" ? cktonIcon : ktonIcon;

  const getRingTooltipMessage = () => {
    return <div>Ring Message</div>;
  };

  const getKtonTooltipMessage = () => {
    return <div>KTON Message</div>;
  };

  const approveMigration = (signerAddress: string) => {
    if (!destination?.address || typeof threshold === "undefined" || threshold === null) {
      return;
    }

    setTransactionStatus(true);
    onApproveMultisigMigration(address, destination.address, signerAddress, (isSuccessful) => {
      if (isSuccessful) {
        setRecentlyApprovedAddresses((old) => {
          return [...old, signerAddress];
        });
      } else {
        notification.error({
          message: <div>{t(localeKeys.migrationFailed)}</div>,
        });
      }
      setTransactionStatus(false);
    });
  };

  return (
    <div className={"flex flex-col"}>
      <div className={"flex flex-col gap-[20px]"}>
        <div>
          {/*in progress*/}
          <div className={"card"}>
            <div className={"dw-custom-scrollbar"}>
              <div className={"min-w-[1100px]"}>
                <div className={"flex flex-col"}>
                  <div className={"px-[20px] flex flex-col"}>
                    <div>
                      <div className={"pb-[10px]"}>{t(localeKeys.progress)}</div>
                      <div className={"bg-black"}>
                        {memberAccounts?.map((item, index) => {
                          let tag: JSX.Element | string = "";
                          const isMyAccount = !!injectedAccounts?.find(
                            (account) => account.formattedAddress.toLowerCase() === item.address.toLowerCase()
                          );
                          if (initializer === item.address) {
                            tag = t(localeKeys.initialized);
                          } else if (item.hasApproved) {
                            tag = t(localeKeys.approved);
                          } else if (isMyAccount) {
                            tag = (
                              <Button onClick={() => approveMigration(item.address)} className={"!h-[30px]"}>
                                {t(localeKeys.approve)}
                              </Button>
                            );
                          } else {
                            tag = "-";
                          }
                          return (
                            <div
                              key={`${item.address}-${index}`}
                              className={`flex justify-between items-center py-[12px] border-b divider`}
                            >
                              <div className={"px-[10px]"}>{item.name}</div>
                              <div className={"flex min-w-[470px] items-center gap-[5px] px-[10px]"}>
                                <Identicon
                                  value={item.address}
                                  size={30}
                                  className={"rounded-full self-start bg-white shrink-0"}
                                  theme={"polkadot"}
                                />
                                <div>{item.address}</div>
                              </div>
                              <div className={"w-[190px] px-[10px]"}>{tag}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={"px-[20px] pt-[20px] flex flex-col"}>
                    <div>
                      <div className={"pb-[10px]"}>{t(localeKeys.parameters)}</div>
                      <div className={"bg-black"}>
                        <div className={`flex py-[12px] border-b divider`}>
                          <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.destination)}</div>
                          <div className={"flex-1 flex gap-[10px] items-center"}>
                            <div>{destination?.address}</div>
                            {!haveAllMembersApproved && (
                              <div className={"text-12 bg-primary px-[5px] py-[4px] flex gap-[4px]"}>
                                <Tooltip message={t(localeKeys.waitingDeployMessage)}>
                                  <img className={"w-[16px] h-[16px]"} src={infoIcon} alt="icon" />
                                </Tooltip>
                                <div>{t(localeKeys.waitingDeploy)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex py-[12px] border-b divider`}>
                          <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.type)}</div>
                          <div className={"flex-1"}>{destination?.type}</div>
                        </div>
                        {destination?.type === "Multisig Account" && (
                          <div className={`flex py-[12px] border-b divider`}>
                            <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.threshold)}</div>
                            <div className={"flex-1"}>{destination?.threshold}</div>
                          </div>
                        )}
                        {destination?.type === "Multisig Account" && (
                          <div className={`flex py-[12px] border-b divider`}>
                            <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.members)}</div>
                            <div className={"flex-1 flex flex-col"}>
                              {destination?.members.map((item, index) => {
                                return <div key={`${item}-${index}`}>{item}</div>;
                              })}
                            </div>
                          </div>
                        )}
                        {/*<div className={`flex py-[12px] border-b divider`}>
                          <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.asset)}</div>
                          <div className={"flex-1"}>
                            <div className={"flex flex-row gap-[20px]"}>
                              <div className={"flex gap-[10px] items-center"}>
                                <img className={"w-[18px] shrink-0"} src={ringTokenIcon} alt="image" />
                                <div className={"flex gap-[10px] items-center"}>
                                  <Tooltip message={prettifyTooltipNumber(destinationParameters.asset.ring)}>
                                    {prettifyNumber({
                                      number: destinationParameters.asset.ring,
                                    })}
                                  </Tooltip>
                                  {selectedNetwork?.ring.symbol.toUpperCase()}
                                </div>
                                <Tooltip className={"shrink-0"} message={getRingTooltipMessage()}>
                                  <img className={"w-[16px] shrink-0 clickable"} src={helpIcon} alt="image" />
                                </Tooltip>
                              </div>
                              <div className={"flex gap-[10px] items-center"}>
                                <img className={"w-[18px] shrink-0"} src={ktonTokenIcon} alt="image" />
                                <div className={"flex gap-[10px] items-center"}>
                                  <Tooltip message={prettifyTooltipNumber(destinationParameters.asset.kton)}>
                                    {prettifyNumber({
                                      number: destinationParameters.asset.kton,
                                    })}
                                  </Tooltip>
                                  {selectedNetwork?.kton.symbol.toUpperCase()}
                                </div>
                                <Tooltip className={"shrink-0"} message={getKtonTooltipMessage()}>
                                  <img className={"w-[16px] shrink-0 clickable"} src={helpIcon} alt="image" />
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>*/}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultisigMigrationProgressTabs;
