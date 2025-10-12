import React from "react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";

const Home: React.FC = () => {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <Sidebar className="w-64">
          <div className="p-4">
            <h2 className="text-xl font-bold">QuantifeX</h2>
          </div>
          <nav className="flex flex-col gap-2 p-4">
            <a
              href="#"
              className="text-sidebar-foreground hover:text-sidebar-primary transition-colors"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-sidebar-foreground hover:text-sidebar-primary transition-colors"
            >
              Watchlist
            </a>
            <a
              href="#"
              className="text-sidebar-foreground hover:text-sidebar-primary transition-colors"
            >
              Settings
            </a>
          </nav>
        </Sidebar>

        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to QuantifeX</h1>
          <p className="text-muted-foreground mb-6">
            Your platform for managing and analyzing data efficiently.
          </p>
          <Button onClick={() => alert("Get Started!")}>Get Started</Button>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Home;
