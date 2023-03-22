import { useAppTranslation, localeKeys } from "@darwinia/app-locale";
import { useWallet } from "@darwinia/app-providers";
import migrationIcon from "../assets/images/migration.svg";
import { dAppSupportedWallets } from "@darwinia/app-config";

const Home = () => {
  const { t } = useAppTranslation();
  const { connectWallet, selectedNetwork, walletConfig } = useWallet();

  return (
    <div className={"flex flex-1 flex-col gap-[20px]"}>
      <div className={"flex flex-col gap-[20px]"}>
        <div className={"flex gap-[20px] items-center"}>
          <img className={"w-[40px]"} src={migrationIcon} alt="migration" />
          <div className={"text-24-bold"} dangerouslySetInnerHTML={{ __html: t(localeKeys.accountMigrationTitle) }} />
        </div>
        <div
          className={"text-12-bold leading-[24px]"}
          dangerouslySetInnerHTML={{
            __html: t(localeKeys.accountMigrationInfo, {
              ringSymbol: selectedNetwork?.ring.symbol,
              ktonSymbol: selectedNetwork?.kton.symbol,
            }),
          }}
        />
      </div>
      <div className={"flex flex-1 flex-col lg:flex-row bg-blackSecondary items-center justify-center gap-5 py-5"}>
        {dAppSupportedWallets.map(({ name, logo, sources }, index) => {
          const selected = name === walletConfig?.name;
          const injecteds = window.injectedWeb3;
          const installed = injecteds && sources.some((source) => injecteds[source]);

          return (
            <button
              className={`flex flex-col gap-[10px] items-center justify-center w-[200px] h-[120px] lg:h-[210px] border transition-colors duration-300 ${
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
        })}
      </div>
    </div>
  );
};

export default Home;
