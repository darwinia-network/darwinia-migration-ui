import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "@darwinia/app-providers";

const Protected = ({ children }: PropsWithChildren) => {
  const { isWalletConnected, isRequestingWalletConnection } = useWallet();
  const location = useLocation();
  //if the user isn't connected to the wallet, redirect to the homepage
  const path = location.pathname.includes("/multisig") ? `/multisig-home` : `/`;
  const params = `${location.search}&redirect=${location.pathname}`;

  if (!isWalletConnected && !isRequestingWalletConnection) {
    return <Navigate to={`${path}${params}`} replace={true} />;
  }

  return <>{children}</>;
};

export default Protected;
