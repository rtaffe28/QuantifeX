import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { clearLocalAuthTokens } from "@/lib/utils";
import userService from "@/api/user";

const Home: React.FC = () => {
  const { isAuthenticated } = useAuthCheck();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("unknown");

  useEffect(() => {
    if (isAuthenticated) {
      userService
        .getUser()
        .then((user) => {
          setUsername(user.username || "unknown");
        })
        .catch(() => {
          setUsername("unknown");
        });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    clearLocalAuthTokens();
    navigate("/");
  };

  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <Sidebar className="w-64 flex flex-col">
          <div className="p-4">
            <h2 className="text-xl font-bold">QuantifeX</h2>
          </div>

          <nav className="flex flex-col gap-2 p-4 flex-1">
            <Link
              to="/"
              className="text-sidebar-foreground hover:text-sidebar-primary transition-colors p-2 rounded-md hover:bg-sidebar-accent"
            >
              Home
            </Link>

            <Link
              to="/watchlist"
              className="text-sidebar-foreground hover:text-sidebar-primary transition-colors p-2 rounded-md hover:bg-sidebar-accent"
            >
              Watchlist
            </Link>

            <Link
              to="/compound-interest-calculator"
              className="text-sidebar-foreground hover:text-sidebar-primary transition-colors p-2 rounded-md hover:bg-sidebar-accent"
            >
              Compound Interest Calculator
            </Link>
          </nav>

          {/* Bottom section - User info */}
          <div className="p-4 border-t border-sidebar-border mt-auto">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="text-sm text-sidebar-foreground">
                  <span className="text-xs text-muted-foreground">
                    Logged in as:
                  </span>
                  <div className="font-medium truncate">{username}</div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button className="w-full">Login</Button>
              </Link>
            )}
          </div>
        </Sidebar>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Home;
