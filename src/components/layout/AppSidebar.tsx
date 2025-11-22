// src/components/layout/AppSidebar.tsx
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Lightbulb, 
  CalendarClock, 
  BarChart3, 
  User,
  Target,
} from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Routine Logs", url: "/routine-logs", icon: Calendar },
  { title: "Recommendations", url: "/recommendations", icon: Lightbulb },
  { title: "Scheduler", url: "/scheduler", icon: CalendarClock },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-2">
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2 py-2 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <RouterNavLink 
                        to={item.url} 
                        end 
                        className={`
                          flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg 
                          transition-all duration-200
                          ${isActive 
                            ? "bg-indigo-600 text-white shadow-md" 
                            : "hover:bg-muted text-foreground"
                          }
                        `}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : ""}`} />
                        {open && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}