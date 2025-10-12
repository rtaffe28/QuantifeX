import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import HomePage from "@/pages/Home";
import Login from "@/pages/Login";
import CompoundInterestCalculator from "@/components/CompoundInterestCalculator";
import Register from "@/pages/Register";

export function Logout() {
  localStorage.clear();
  return <Navigate to="/" replace />;
}

export function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        path: "/compound-interest-calculator",
        element: <CompoundInterestCalculator />,
      },
    ],
  },

  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <RegisterAndLogout />,
  },
  {
    path: "/logout",
    element: <Logout />,
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
