import {
  LayoutDashboard, Users, Phone, Send, Clock, BarChart3, Upload, Settings, UserCog, FileText, Building2, ChevronDown, TrendingUp, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useRole, roleLabels } from "@/contexts/RoleContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/lms";

const agentNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Leads", url: "/leads", icon: Users },
  { title: "Follow-Ups", url: "/follow-ups", icon: Clock },
  { title: "My STB", url: "/stb", icon: Send },
  { title: "Performance", url: "/performance", icon: TrendingUp },
];

const managerNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Leads", url: "/leads", icon: Users },
  { title: "My Follow-Ups", url: "/follow-ups", icon: Clock },
  { title: "My STB", url: "/stb", icon: Send },
  { title: "Group Leads", url: "/group-leads", icon: Users },
  { title: "Group Follow-Ups", url: "/group-follow-ups", icon: Clock },
  { title: "Group STB", url: "/group-stb", icon: Send },
  { title: "Group Mgmt", url: "/group-management", icon: UserCog },
  { title: "Lead Report", url: "/group-reports", icon: FileText },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "MIS Reports", url: "/reports", icon: BarChart3 },
];

const clusterHeadNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Org Leads", url: "/org-leads", icon: Users },
  { title: "Org Follow-Ups", url: "/org-follow-ups", icon: Clock },
  { title: "Org STB", url: "/org-stb", icon: Send },
  { title: "Staff Mgmt", url: "/staff-management", icon: UserCog },
  { title: "System Config", url: "/system-config", icon: Settings },
  { title: "Lead Allocation", url: "/lead-allocation", icon: Upload },
  { title: "Lead Report", url: "/org-reports", icon: FileText },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Audit Trail", url: "/audit-trail", icon: BarChart3 },
  { title: "MIS & Reports", url: "/reports", icon: BarChart3 },
];

const adminNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lead Upload", url: "/admin/upload", icon: Upload },
  { title: "Lead Allocation", url: "/admin/allocation", icon: Users },
  { title: "Lead Pools", url: "/admin/pools", icon: FileText },
  { title: "MIS Export", url: "/admin/mis", icon: BarChart3 },
  { title: "System Config", url: "/system-config", icon: Settings },
  { title: "Staff Mgmt", url: "/admin/staff", icon: UserCog },
  { title: "System Config", url: "/system-config", icon: Settings },
  { title: "Audit Trail", url: "/audit-trail", icon: Shield },
  { title: "Performance", url: "/performance", icon: TrendingUp },
];

function getNav(role: UserRole) {
  switch (role) {
    case "agent": return agentNav;
    case "manager": return managerNav;
    case "cluster_head": return clusterHeadNav;
    case "data_admin": return adminNav;
  }
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, setRole } = useRole();
  const location = useLocation();
  const nav = getNav(role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground text-sm font-bold">S</span>
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">Smart LMS</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground text-sm font-bold">S</span>
            </div>
          </div>
        )}
        {!collapsed && (
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger className="w-full bg-sidebar-accent text-sidebar-foreground border-sidebar-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {role === "data_admin" ? "Admin Portal" : "LMS Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="text-xs text-sidebar-foreground/50">
            v1.0 Prototype
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
