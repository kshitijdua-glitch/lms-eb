import {
  LayoutDashboard, Users, Phone, Send, Clock, BarChart3, Upload, Settings, UserCog, FileText, TrendingUp, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole, roleLabels } from "@/contexts/RoleContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { UserRole } from "@/types/lms";
import { useAuth } from "@/contexts/AuthContext";
import logoUrl from "@/assets/logo.png";

const agentNav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "My Leads", url: "/leads", icon: Users },
  { title: "Follow-Ups", url: "/follow-ups", icon: Clock },
  { title: "My STB", url: "/stb", icon: Send },
  { title: "Performance", url: "/performance", icon: TrendingUp },
];

const managerNav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
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
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Org Leads", url: "/org-leads", icon: Users },
  { title: "Org Follow-Ups", url: "/org-follow-ups", icon: Clock },
  { title: "Org STB", url: "/org-stb", icon: Send },
  { title: "Staff Mgmt", url: "/staff-management", icon: UserCog },
  { title: "System Config", url: "/system-config", icon: Settings },
  { title: "Lead Allocation", url: "/admin/allocation", icon: Upload },
  { title: "Lead Report", url: "/org-reports", icon: FileText },
  { title: "Audit Trail", url: "/audit-trail", icon: BarChart3 },
  { title: "MIS & Reports", url: "/reports", icon: BarChart3 },
];

const adminNav = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Lead Upload", url: "/admin/upload", icon: Upload },
  { title: "Lead Allocation", url: "/admin/allocation", icon: Users },
  { title: "Lead Pools", url: "/admin/pools", icon: FileText },
  { title: "Lending Partners", url: "/admin/partners", icon: Send },
  { title: "MIS Export", url: "/admin/mis", icon: BarChart3 },
  { title: "System Config", url: "/system-config", icon: Settings },
  { title: "Staff Mgmt", url: "/admin/staff", icon: UserCog },
  { title: "Audit Trail", url: "/audit-trail", icon: Shield },
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
  const { role } = useRole();
  const { user } = useAuth();
  const nav = getNav(role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center overflow-hidden ring-1 ring-sidebar-border shadow-sm">
              <img src={logoUrl} alt="Smart LMS logo" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">Smart LMS</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-2">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center overflow-hidden ring-1 ring-sidebar-border shadow-sm">
              <img src={logoUrl} alt="Smart LMS logo" className="h-5 w-5 object-contain" />
            </div>
          </div>
        )}
        {!collapsed && user && (
          <div className="rounded-md bg-sidebar-accent/40 px-2.5 py-1.5">
            <div className="text-[11px] font-medium text-sidebar-foreground truncate">{user.name}</div>
            <div className="text-[10px] text-sidebar-foreground/60">{roleLabels[role]}</div>
          </div>
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
                      end={item.url === "/app"}
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
          <div className="space-y-1">
            {user && (
              <div className="text-xs text-sidebar-foreground/70 truncate">
                Signed in as <span className="font-medium text-sidebar-foreground">{user.name}</span>
              </div>
            )}
            <div className="text-xs text-sidebar-foreground/50">v1.0 Prototype</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
