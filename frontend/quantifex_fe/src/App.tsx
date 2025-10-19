import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import HomePage from "@/pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/watchlist",
    element: <HomePage />,
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
