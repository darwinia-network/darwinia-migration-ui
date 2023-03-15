import { Tabs, Tab, Tooltip } from "@darwinia/ui";
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
import { prettifyNumber, prettifyTooltipNumber } from "@darwinia/app-utils";

const MultisigMigrationProgressTabs = () => {
  const { t } = useAppTranslation();
  const [memberAccounts, setMemberAccounts] = useState<string[]>();
  const location = useLocation();
  const { selectedNetwork } = useWallet();
  const params = new URLSearchParams(location.search);
  const address = params.get("address");
  const members = (params.get("who") ?? "").split(",");
  const name = params.get("name");
  const threshold = params.get("threshold");

  useEffect(() => {
    const members = (params.get("who") ?? "").split(",");
    setMemberAccounts(members);
  }, [location]);

  const tabs: Tab[] = [
    {
      id: "1",
      title: t(localeKeys.inProgress, { number: 3 }),
    },
    {
      id: "2",
      title: t(localeKeys.confirmedExtrinsic, { number: 0 }),
    },
    {
      id: "3",
      title: t(localeKeys.cancelledExtrinsics, { number: 0 }),
    },
  ];
  const [selectedTab, setSelectedTab] = useState<Tab>(tabs[0]);
  const onTabsChange = (selectedTab: Tab) => {
    setSelectedTab(selectedTab);
  };

  const parameters = {
    destination: {
      account: "0xe59261f6D4088BcD69985A3D369Ff14cC54EF1E5",
      status: 0,
    },
    type: "Multisig Account",
    threshold: threshold,
    member: members,
    asset: {
      ring: BigNumber(20000000000000000000),
      kton: BigNumber(35000000000000000000),
    },
  };

  const ringTokenIcon = selectedNetwork?.name === "Crab" ? crabIcon : ringIcon;
  const ktonTokenIcon = selectedNetwork?.name === "Crab" ? cktonIcon : ktonIcon;

  const getRingTooltipMessage = () => {
    return <div>Ring Message</div>;
  };

  const getKtonTooltipMessage = () => {
    return <div>KTON Message</div>;
  };

  return (
    <div className={"flex flex-col"}>
      <div className={"flex flex-col gap-[20px]"}>
        <div>
          <Tabs onChange={onTabsChange} tabs={tabs} activeTabId={selectedTab.id} />
        </div>
        <div>
          {/*in progress*/}
          <div className={"card"}>
            <div className={"dw-custom-scrollbar"}>
              <div className={"min-w-[1100px]"}>
                <div className={"bg-black px-[10px] py-[20px] !text-[12px] flex"}>
                  <div className={"flex-1 shrink-0"}>{t(localeKeys.callHash)}</div>
                  <div className={"w-[285px]"}>{t(localeKeys.status)}</div>
                  <div className={"w-[160px]"}>{t(localeKeys.progress)}</div>
                  <div className={"w-[225px]"}>{t(localeKeys.action)}</div>
                </div>
                <div className={"flex flex-col"}>
                  <div className={"border-t border-b divider px-[10px] py-[15px] !text-[12px] flex"}>
                    <div className={"flex-1 shrink-0"}>0x0E55c72781aCD923C4e3e7Ad9bB8363de15ef204</div>
                    <div className={"w-[285px]"}>Multisig_Account_Migrate</div>
                    <div className={"w-[160px]"}>3/3</div>
                    <div className={"w-[225px]"}>{t(localeKeys.executed)}</div>
                  </div>
                  <div className={"px-[20px] pt-[20px] flex flex-col"}>
                    <div>
                      <div className={"pb-[10px]"}>{t(localeKeys.progress)}</div>
                      <div className={"bg-black"}>
                        {memberAccounts?.map((item) => {
                          return (
                            <div key={item} className={`flex justify-between py-[12px] border-b divider`}>
                              <div className={"px-[10px]"}>onchainmoney.com</div>
                              <div className={"flex min-w-[470px] items-center gap-[5px] px-[10px]"}>
                                <Identicon
                                  value={item}
                                  size={30}
                                  className={"rounded-full self-start bg-white shrink-0"}
                                  theme={"polkadot"}
                                />
                                <div>{item}</div>
                              </div>
                              <div className={"w-[190px] px-[10px]"}>Initialized</div>
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
                            <div>{parameters.destination.account}</div>
                            <div className={"text-12 bg-primary px-[5px] py-[4px] flex gap-[4px]"}>
                              <Tooltip message={t(localeKeys.waitingDeployMessage)}>
                                <img className={"w-[16px] h-[16px]"} src={infoIcon} alt="icon" />
                              </Tooltip>
                              <div>{t(localeKeys.waitingDeploy)}</div>
                            </div>
                          </div>
                        </div>
                        <div className={`flex py-[12px] border-b divider`}>
                          <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.type)}</div>
                          <div className={"flex-1"}>{parameters.type}</div>
                        </div>
                        <div className={`flex py-[12px] border-b divider`}>
                          <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.threshold)}</div>
                          <div className={"flex-1"}>{parameters.threshold}</div>
                        </div>
                        <div className={`flex py-[12px] border-b divider`}>
                          <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.members)}</div>
                          <div className={"flex-1 flex flex-col"}>
                            {parameters.member.map((item, index) => {
                              return <div key={`${item}-${index}`}>{item}</div>;
                            })}
                          </div>
                        </div>
                        <div className={`flex py-[12px] border-b divider`}>
                          <div className={"px-[10px] min-w-[160px] shrink-0"}>{t(localeKeys.asset)}</div>
                          <div className={"flex-1"}>
                            <div className={"flex flex-row gap-[20px]"}>
                              <div className={"flex gap-[10px] items-center"}>
                                <img className={"w-[18px] shrink-0"} src={ringTokenIcon} alt="image" />
                                <div className={"flex gap-[10px] items-center"}>
                                  <Tooltip message={prettifyTooltipNumber(parameters.asset.ring)}>
                                    {prettifyNumber({
                                      number: parameters.asset.ring,
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
                                  <Tooltip message={prettifyTooltipNumber(parameters.asset.kton)}>
                                    {prettifyNumber({
                                      number: parameters.asset.kton,
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
    </div>
  );
};

export default MultisigMigrationProgressTabs;
