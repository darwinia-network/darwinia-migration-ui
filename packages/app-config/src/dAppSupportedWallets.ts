import polkadotJSExtensionLogo from "./assets/images/wallets/polkadot-js.svg";
import talismanJSExtensionLogo from "./assets/images/wallets/talisman.svg";
import subwalletJSExtensionLogo from "./assets/images/wallets/subwallet-js.svg";
import novaWalletLogo from "./assets/images/wallets/novawallet.png";
import { WalletConfig } from "@darwinia/app-types";

export const dAppSupportedWallets: WalletConfig[] = [
  {
    name: "Polkadot{.js}",
    logo: polkadotJSExtensionLogo,
    extensions: [
      {
        browser: "Chrome",
        downloadURL: "https://polkadot.js.org/extension/",
      },
      {
        browser: "Firefox",
        downloadURL: "https://polkadot.js.org/extension/",
      },
      {
        browser: "Brave",
        downloadURL: "https://polkadot.js.org/extension/",
      },
      {
        browser: "Edge",
        downloadURL: "https://polkadot.js.org/extension/",
      },
      {
        browser: "Opera",
        downloadURL: "https://polkadot.js.org/extension/",
      },
    ],
    sources: ['polkadot-js', '"polkadot-js"'],
  },
  {
    name: "Talisman",
    logo: talismanJSExtensionLogo,
    extensions: [
      {
        browser: "Chrome",
        downloadURL: "https://chrome.google.com/webstore/detail/talisman-wallet/fijngjgcjhjmmpcmkeiomlglpeiijkld",
      },
      {
        browser: "Firefox",
        downloadURL: "https://addons.mozilla.org/en-US/firefox/addon/talisman-wallet-extension/",
      },
    ],
    sources: ['talisman', '"talisman"'],
  },
  {
    name: "SubWallet",
    logo: subwalletJSExtensionLogo,
    extensions: [
      {
        browser: "Chrome",
        downloadURL: "https://subwallet.app/download.html",
      },
      {
        browser: "Firefox",
        downloadURL: "https://subwallet.app/download.html",
      },
      {
        browser: "Brave",
        downloadURL: "https://subwallet.app/download.html",
      },
      {
        browser: "Edge",
        downloadURL: "https://subwallet.app/download.html",
      },
      {
        browser: "Opera",
        downloadURL: "https://subwallet.app/download.html",
      },
    ],
    sources: ['subwallet-js', '"subwallet-js"']
  },
  {
    name: "NovaWallet",
    logo: novaWalletLogo,
    extensions: [],
    sources: [],
  },
];
