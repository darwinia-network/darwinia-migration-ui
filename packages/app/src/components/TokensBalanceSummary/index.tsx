import ringIcon from "../../assets/images/ring.svg";
import { localeKeys, useAppTranslation } from "@darwinia/app-locale";
import { Tooltip } from "@darwinia/ui";
import { prettifyNumber, prettifyTooltipNumber } from "@darwinia/app-utils";
import BigNumber from "bignumber.js";
import helpIcon from "../../assets/images/help.svg";
import ktonIcon from "../../assets/images/kton.svg";
import { useWallet } from "@darwinia/app-providers";
import { AssetDistribution } from "@darwinia/app-types";
import crabIcon from "../../assets/images/crab.svg";
import cktonIcon from "../../assets/images/ckton.svg";

interface Props {
  asset: AssetDistribution | undefined;
}

const TokensBalanceSummary = ({ asset: assetDistribution }: Props) => {
  const { selectedNetwork } = useWallet();
  const { t } = useAppTranslation();

  const ringTokenIcon = selectedNetwork?.name === "Crab" ? crabIcon : ringIcon;
  const ktonTokenIcon = selectedNetwork?.name === "Crab" ? cktonIcon : ktonIcon;

  return (
    <>
      <div className={"flex flex-col lg:flex-row gap-[20px]"}>
        <div className={"card bg-black flex-1 flex gap-[20px] flex-col"}>
          <div className={"flex pb-[20px] divider border-b"}>
            <div className={"flex flex-1 gap-[5px] justify-between items-center"}>
              <div className={"flex items-center gap-[5px]"}>
                <img className={"w-[30px] shrink-0"} src={ringTokenIcon} alt={"image"} />
                <div className={"text-18-bold"}>{selectedNetwork?.ring.symbol.toUpperCase()}</div>
              </div>
            </div>
          </div>
          <div className={"text-halfWhite text-12 flex flex-col gap-[10px]"}>
            <div className={"flex justify-between"}>
              <div>{t(localeKeys.transferable)}</div>
              <div>
                <Tooltip
                  message={<div>{prettifyTooltipNumber(assetDistribution?.ring.transferable ?? BigNumber(0))}</div>}
                >
                  {prettifyNumber({
                    number: assetDistribution?.ring.transferable ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div>{t(localeKeys.deposit)}</div>
              <div>
                <Tooltip message={<div>{prettifyTooltipNumber(assetDistribution?.ring.deposit ?? BigNumber(0))}</div>}>
                  {prettifyNumber({
                    number: assetDistribution?.ring.deposit ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div>{t(localeKeys.bonded)}</div>
              <div>
                <Tooltip message={<div>{prettifyTooltipNumber(assetDistribution?.ring.bonded ?? BigNumber(0))}</div>}>
                  {prettifyNumber({
                    number: assetDistribution?.ring.bonded ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div>{t(localeKeys.unbonded)}</div>
              <div>
                <Tooltip message={<div>{prettifyTooltipNumber(assetDistribution?.ring.unbonded ?? BigNumber(0))}</div>}>
                  {prettifyNumber({
                    number: assetDistribution?.ring.unbonded ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div className={"flex items-center gap-[5px]"}>
                <div>{t(localeKeys.unbonding)}</div>
                <Tooltip message={<div>Ubonding Message</div>}>
                  <img className={"w-[11px]"} src={helpIcon} alt="image" />
                </Tooltip>
              </div>
              <div>
                <Tooltip
                  message={<div>{prettifyTooltipNumber(assetDistribution?.ring.unbonding ?? BigNumber(0))}</div>}
                >
                  {prettifyNumber({
                    number: assetDistribution?.ring.unbonding ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div className={"flex items-center gap-[5px]"}>
                <div>{t(localeKeys.vested)}</div>
                <Tooltip message={<div>Vested Message</div>}>
                  <img className={"w-[11px]"} src={helpIcon} alt="image" />
                </Tooltip>
              </div>
              <div>
                <Tooltip message={<div>{prettifyTooltipNumber(assetDistribution?.ring.vested ?? BigNumber(0))}</div>}>
                  {prettifyNumber({
                    number: assetDistribution?.ring.vested ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        <div className={"card bg-black flex-1 flex gap-[20px] flex-col"}>
          <div className={"flex pb-[20px] divider border-b"}>
            <div className={"flex flex-1 gap-[5px] justify-between items-center"}>
              <div className={"flex items-center gap-[5px]"}>
                <img className={"w-[30px] shrink-0"} src={ktonTokenIcon} alt={"image"} />
                <div className={"text-18-bold"}>{selectedNetwork?.kton.symbol.toUpperCase()}</div>
              </div>
            </div>
          </div>
          <div className={"text-halfWhite text-12 flex flex-col gap-[10px]"}>
            <div className={"flex justify-between"}>
              <div>{t(localeKeys.transferable)}</div>
              <div>
                <Tooltip
                  message={<div>{prettifyTooltipNumber(assetDistribution?.kton.transferable ?? BigNumber(0))}</div>}
                >
                  {prettifyNumber({
                    number: assetDistribution?.kton.transferable ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div>{t(localeKeys.bonded)}</div>
              <div>
                <Tooltip message={<div>{prettifyTooltipNumber(assetDistribution?.kton.bonded ?? BigNumber(0))}</div>}>
                  {prettifyNumber({
                    number: assetDistribution?.kton.bonded ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div>{t(localeKeys.unbonded)}</div>
              <div>
                <Tooltip message={<div>{prettifyTooltipNumber(assetDistribution?.kton.unbonded ?? BigNumber(0))}</div>}>
                  {prettifyNumber({
                    number: assetDistribution?.kton.unbonded ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
            <div className={"flex justify-between"}>
              <div className={"flex items-center gap-[5px]"}>
                <div>{t(localeKeys.unbonding)}</div>
                <Tooltip message={<div>Ubonding Message</div>}>
                  <img className={"w-[11px]"} src={helpIcon} alt="image" />
                </Tooltip>
              </div>
              <div>
                <Tooltip
                  message={<div>{prettifyTooltipNumber(assetDistribution?.kton.unbonding ?? BigNumber(0))}</div>}
                >
                  {prettifyNumber({
                    number: assetDistribution?.kton.unbonding ?? BigNumber(0),
                  })}
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TokensBalanceSummary;
