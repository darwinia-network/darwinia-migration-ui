import { useAppTranslation, localeKeys } from "@darwinia/app-locale";
import { useMobile, useWallet } from "@darwinia/app-providers";
import migrationIcon from "../assets/images/migration.svg";
import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { dAppSupportedWallets } from "@darwinia/app-config";

const MultisigHome = () => {
  const { t } = useAppTranslation();
  const { connectWallet, walletConfig } = useWallet();
  const { isMobile } = useMobile();

  return (
    <div className={"flex flex-1 flex-col gap-[20px]"}>
      <div className={"flex flex-col gap-[20px]"}>
        <div className={"flex gap-[20px] items-center"}>
          <img className={"w-[40px]"} src={migrationIcon} alt="migration" />
          <div
            className={"text-24-bold"}
            dangerouslySetInnerHTML={{ __html: t(localeKeys.multisigAccountMigrationTitle) }}
          />
        </div>
      </div>
      <div className={"flex flex-1 bg-blackSecondary items-center justify-center gap-5"}>
        {isMobile ? (
          <button
            className="flex items-center justify-center border border-primary transition duration-300 hover:opacity-60 w-3/4 py-10"
            onClick={() => connectWallet("NovaWallet")}
          >
            {t(localeKeys.connectWallet)}
          </button>
        ) : (
          dAppSupportedWallets.map(({ name, logo, sources }, index) => {
            const selected = name === walletConfig?.name;
            const injecteds = window.injectedWeb3;
            const installed = injecteds && sources.some((source) => injecteds[source]);

            return (
              <button
                className={`flex flex-col gap-[10px] items-center justify-center w-[200px] h-[210px] border transition-colors duration-300 ${
                  !installed ? "bg-white/20" : "hover:border-primary"
                } ${selected ? "border-primary" : "border-white/20"}`}
                key={index}
                onClick={() => connectWallet(name)}
                disabled={!installed}
              >
                <img className={"w-[55px]"} src={logo} alt="image" />
                <span className="text-14-bold">{name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MultisigHome;
