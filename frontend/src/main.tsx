import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthProvider.tsx";
import BatteryStatusPage from "./pages/BatteryStatus.tsx";
import BatteryRecommendationsPage from "./pages/BatteryRecommendations.tsx";
import HomePage from "./pages/base/home.tsx";
import LoginPage from "./pages/base/Login.tsx";
import NotFoundPage from "./pages/base/NotFound.tsx";
import BatteryInfoPage from "./pages/BatteryInfo.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      // For every user, auth not required
      { path: "battery-status", element: <BatteryStatusPage /> },
      {
        element: <ProtectedRoute allowedRoles={["garage"]} />,
        children: [{ path: "battery-info", element: <BatteryInfoPage /> }],
      },
      {
        element: <ProtectedRoute allowedRoles={["recycler"]} />,
        children: [
          {
            path: "battery-recommendations",
            element: <BatteryRecommendationsPage />,
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
