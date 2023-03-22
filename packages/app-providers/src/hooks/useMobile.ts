import { useEffect, useState } from "react";
import { isMobile as isMobileUtil } from "@darwinia/app-utils";

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(isMobileUtil());

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsMobile(!mq.matches);

    const listener = (ev: MediaQueryListEvent) => {
      setIsMobile(!ev.matches || isMobileUtil());
    };
    mq.addEventListener("change", listener, false);
    return () => {
      mq.removeEventListener("change", listener);
    };
  }, []);

  return { isMobile };
};
