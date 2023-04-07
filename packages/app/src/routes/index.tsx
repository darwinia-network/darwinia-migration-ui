import { lazy } from "react";
import { createHashRouter } from "react-router-dom";
import { Suspense } from "react";
import App from "../App";
import NotFound from "../pages/NotFound";
import ErrorCatcher from "../pages/ErrorCatcher";
import Protected from "../components/Protected";
import { Spinner } from "@darwinia/ui";

const LazyLoader = ({ componentFileName }: { componentFileName: string }) => {
  /* rollup is strict to dynamic imports
   refer https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations */
  const Component = lazy(() => import(`../pages/${componentFileName}.tsx`));
  return (
    <Suspense fallback={getPageLoadingSpinner()}>
      <Component />
    </Suspense>
  );
};

/* Add all the app routes in here.
 * For nested routes, make sure that the child route contains the
 * parent route path as well, otherwise your navigation links
 * highlighting may not work as expected eg: the path parent-path/details
 * is the child page of parent-path. If there are more than one root pages that
 * need to jump to the same page, make sure that their parent paths match the links
 * accordingly ie: add several links (in createHashRouter) that will open the same component */
const browserRouter = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorCatcher />,
    children: [
      {
        index: true,
        element: <LazyLoader componentFileName={"Home"} />,
      },
      {
        path: "multisig-home",
        element: <LazyLoader componentFileName={"MultisigHome"} />,
      },
      {
        //This path is used when migrating a normal account
        path: "migration",
        element: (
          <Protected>
            <LazyLoader componentFileName={"Migration"} />
          </Protected>
        ),
      },
      {
        //This path is used when migrating a multisig account
        path: "multisig-migration",
        element: (
          <Protected>
            <LazyLoader componentFileName={"MultisigMigration"} />
          </Protected>
        ),
      },
      {
        path: "multisig-account-migration-summary",
        element: (
          <Protected>
            <LazyLoader componentFileName={"MultisigAccountMigrationSummary"} />
          </Protected>
        ),
      },
      /*{
        path: "relayers-overview",
        element: <LazyLoader componentFileName={"RelayersOverview"} />,
      },
      {
        path: "relayers-overview/details",
        element: <LazyLoader componentFileName={"RelayerDetails"} />,
      },
      {
        path: "relayer-dashboard",
        element: <LazyLoader componentFileName={"RelayerDashboard"} />,
      },
      {
        path: "orders",
        element: <LazyLoader componentFileName={"Orders"} />,
      },
      {
        path: "orders/details",
        element: <LazyLoader componentFileName={"OrderDetails"} />,
      },*/
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const getPageLoadingSpinner = () => {
  // change isLoading to true to show the spinner
  return (
    <Spinner isLoading={false}>
      <div className={`flex h-[calc(100vh-119px)] lg:h-[calc(100vh-110px)] justify-center items-center`} />
    </Spinner>
  );
};

export default browserRouter;
