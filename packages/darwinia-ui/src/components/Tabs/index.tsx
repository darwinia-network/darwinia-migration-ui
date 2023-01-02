import "./styles.scss";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Tab {
  id: string;
  title: string;
}
export interface TabsProps {
  onChange: (selectedTab: Tab) => void;
  tabs: Tab[];
  activeTabId: string;
}
const Tabs = ({ onChange, tabs, activeTabId }: TabsProps) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(-1);

  const getDynamicTabClass = (index: number): string => {
    return `tab-${index}`;
  };

  const updateActiveTabUI = () => {
    if (tabsRef.current && railRef.current) {
      const dynamicClass = getDynamicTabClass(activeTabIndex);
      const tabDOM = tabsRef.current.querySelector(`.${dynamicClass}`);
      if (!tabDOM) {
        return;
      }

      const offsetLeft = (tabDOM as HTMLDivElement).offsetLeft;
      const width = (tabDOM as HTMLDivElement).clientWidth;
      railRef.current.style.width = `${width}px`;
      railRef.current.style.transform = `translate3d(${offsetLeft}px,0,0)`;
    }
  };

  /*Monitor Tabs changes in size*/
  useEffect(() => {
    const mutation = new MutationObserver(() => {
      updateActiveTabUI();
    });

    if (tabsRef.current) {
      mutation.observe(tabsRef.current, {
        childList: true,
        attributes: true,
        subtree: true,
      });
    }

    return () => {
      mutation.disconnect();
    };
  }, [activeTabIndex]);

  useEffect(() => {
    setTimeout(() => {
      updateActiveTabUI();
    }, 100);
  }, [tabsRef.current, railRef.current, activeTabIndex]);

  useEffect(() => {
    if (activeTabIndex === -1) {
      return;
    }
    updateActiveTabUI();
  }, [activeTabIndex]);

  useEffect(() => {
    setTimeout(() => {
      const tabIndex = tabs.findIndex((item) => item.id === activeTabId);
      if (tabIndex > -1) {
        setActiveTabIndex(tabIndex);
      }
    }, 200);
  }, [activeTabId]);

  const onTabClicked = (index: number, tab: Tab) => {
    setActiveTabIndex(index);
    onChange(tab);
  };

  return (
    <div className={"dw-tabs-wrapper"}>
      <div className={"dw-tabs-scrollview dw-custom-scrollbar"}>
        <div ref={tabsRef} className={"dw-tabs"}>
          <div ref={railRef} className={"dw-tab-rail"} />
          {tabs.map((item, index) => {
            const activeClass = index === activeTabIndex ? "dw-active-tab" : "";
            return (
              <div
                onClick={() => {
                  onTabClicked(index, item);
                }}
                className={`dw-tab ${activeClass} ${getDynamicTabClass(index)}`}
                key={item.id}
              >
                {item.title}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tabs;
