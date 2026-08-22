import { Authenticated, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  ErrorComponent,
  RefineSnackbarProvider,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/mui";
import Navkit from "@taruvi/navkit";
import { Box } from "@mui/material";
import { CssBaseline } from "@mui/material";
import { GlobalStyles } from "@mui/material";
import routerProvider, { DocumentTitleHandler } from "@refinedev/react-router";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { taruviClient } from "./taruviClient";
import {
  taruviDataProvider,
  taruviAuthProvider,
  taruviStorageProvider,
  taruviAppProvider,
  taruviUserProvider,
  // taruviAccessControlProvider, // Uncomment to enable Cerbos-based access control
} from "./providers/refineProviders";
import { CustomSider, ErrorBoundary, UnsavedChangesDialog } from "./components";
import { ColorModeContextProvider, ColorModeContext } from "./contexts/color-mode";
import {AppSettingsProvider, useAppSettings} from "./contexts/app-settings";
import { useContext, useEffect, useRef } from "react";
import { Home } from "./pages/home";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { ForgotPassword } from "./pages/forgotPassword";
import { useNavkitProfileMenuItems } from "./navkit/useNavkitProfileMenuItems";

const AppContent = () => {
  const { settings } = useAppSettings();
  const { setMode } = useContext(ColorModeContext);
  const navRef = useRef<HTMLDivElement>(null);
  const profileMenuItems = useNavkitProfileMenuItems();

  // Layout CSS reads --nav-height; keep it in sync with the rendered Navkit bar.
  useEffect(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    }
  }, []);

  return (
    <>
      <div
        ref={navRef}
        data-nav-container
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1300,
          width: '100%',
        }}
      >
        <Navkit
          client={taruviClient}
          getTheme={(theme) => setMode(theme)}
          profileMenuItems={profileMenuItems}
        />
      </div>
      <RefineSnackbarProvider>
            
              <Refine
                dataProvider={{
                  default: taruviDataProvider,
                  storage: taruviStorageProvider,
                  app: taruviAppProvider,
                  user: taruviUserProvider,
                }}
                notificationProvider={useNotificationProvider}
                routerProvider={routerProvider}
                authProvider={taruviAuthProvider}
                // accessControlProvider={taruviAccessControlProvider} // Uncomment to enable Cerbos-based access control
                resources={[
                  // Add your resources here
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "obEpHJ-M7JimA-31GF1J",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="login-route"
                        fallback={<Outlet />}
                      >
                        <Navigate to="/" replace />
                      </Authenticated>
                    }
                  >
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<Navigate to="/login" replace />}
                      >
                        <ThemedLayout
                          Header={() => null}
                          Sider={CustomSider}
                          initialSiderCollapsed={true}
                          childrenBoxProps={{ sx: { p: 0 } }}
                        >
                          <Box sx={{ ml: { xs: 0, md: '72px' }, transition: 'margin-left 0.2s ease-in-out' }}>
                            <ErrorBoundary>
                              <Outlet />
                            </ErrorBoundary>
                          </Box>
                        </ThemedLayout>
                      </Authenticated>
                    }
                  >
                    <Route index element={<Home />} />
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesDialog />
                <DocumentTitleHandler handler={() => settings?.displayName || ""}/>
              </Refine>
              
            
          </RefineSnackbarProvider>
    </>
  );
};

/**
 * Previews are served under a path prefix (/space/<id>/preview/<branch>/);
 * the router must treat that prefix as its root or every route 404s. Deployed
 * apps serve from "/" and the match yields an empty basename.
 */
const routerBasename =
  window.location.pathname.match(/^\/space\/[^/]+\/preview\/[^/]+/)?.[0] ?? "";

function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AppSettingsProvider>
            <CssBaseline />
            <GlobalStyles
              styles={{
                html: { WebkitFontSmoothing: 'antialiased' },
                body: { fontFamily: "'Open Sans', sans-serif" },
                'h1, h2, h3, h4, h5, h6': { fontFamily: "'Quicksand', sans-serif" },
                '*::-webkit-scrollbar': { width: 8, height: 8 },
                '*::-webkit-scrollbar-track': { background: 'transparent' },
                '*::-webkit-scrollbar-thumb': {
                  background: 'rgba(0,0,0,0.18)',
                  borderRadius: 8,
                },
                '*::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.32)' },
                '[data-theme="dark"] *::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.18)',
                },
              }}
            />
            <AppContent />
          </AppSettingsProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
