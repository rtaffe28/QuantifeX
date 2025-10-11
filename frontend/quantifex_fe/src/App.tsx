import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import HomePage from "./pages/HomePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
]);

const App: React.FC = () => {
  return (
    <SidebarProvider>
      <RouterProvider router={router} />
    </SidebarProvider>
  );
};

export default App;
