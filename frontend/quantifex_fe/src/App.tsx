import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import HomePage from "@/pages/Home";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { CompoundInterestCalculator } from "./components/CompoundInterestCalculator";
import { KellyCriterionCalculator } from "./components/KellyCriterionCalculator";
import ProtectedRoute from "./components/ProtectedRoute";
import WatchlistPage from "./pages/WatchlistPage";
import { TransactionsTable } from "./components/TransactionsTable";
import { LandingHero } from "./components/LandingHero";
import BacktestingPage from "./pages/BacktestingPage";
import MonteCarloPage from "./pages/MonteCarloPage";
import EarningsCalendarPage from "./pages/EarningsCalendarPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        index: true,
        element: <LandingHero />,
      },
      {
        path: "/watchlist",

        element: (
          <ProtectedRoute>
            <WatchlistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/transactions",
        element: (
          <ProtectedRoute>
            <TransactionsTable />
          </ProtectedRoute>
        ),
      },
      {
        path: "/backtesting",
        element: (
          <ProtectedRoute>
            <BacktestingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/monte-carlo",
        element: (
          <ProtectedRoute>
            <MonteCarloPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/earnings-calendar",
        element: (
          <ProtectedRoute>
            <EarningsCalendarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/compound-interest-calculator",
        element: <CompoundInterestCalculator />,
      },
      {
        path: "/kelly-criterion",
        element: <KellyCriterionCalculator />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/register",
    element: <RegisterForm />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
