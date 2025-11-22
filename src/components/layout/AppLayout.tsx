// src/components/layout/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import AIChatbot from "@/components/AIChatbot";

const AppLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center">
            <SidebarTrigger />
            <h1 className="ml-4 text-sm font-medium text-foreground">
              Student Productivity Dashboard
            </h1>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-muted"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-slate-700" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Chatbot - Floating */}
      <AIChatbot />
    </div>
  );
};

export default AppLayout;