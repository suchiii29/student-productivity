import { getAuth } from "firebase/auth";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import RoutineLogs from "./pages/RoutineLogs";
import Recommendations from "./pages/Recommendations";
import Scheduler from "./pages/Scheduler";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import AppLayout from "./components/layout/AppLayout";

// 🔥 IMPORTANT: MUST import with .js because your project uses "type": "module"
import { app } from "./firebase.js";

const queryClient = new QueryClient();
const auth = getAuth(app);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* ShadCN toaster */}
        <Toaster />

        {/* Sonner toaster */}
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected layout routes */}
            <Route
              element={
                <SidebarProvider>
                  <AppLayout />
                </SidebarProvider>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/routine-logs" element={<RoutineLogs />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
