import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import HomePage from "@/pages/Home";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import ProtectedRoute from "./components/ProtectedRoute";
import { Autocomplete } from "./components/Autocomplete";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        path: "/watchlist",
        element: <Autocomplete />,
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
