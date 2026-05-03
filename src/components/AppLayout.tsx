import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useRole, roleLabels } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import { NotificationsDrawer } from "@/components/NotificationsDrawer";
import { ProfileMenu } from "@/components/ProfileMenu";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { ScopeChip } from "@/components/ScopeChip";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = useRole();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DemoModeBanner />
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <div className="flex-1" />
            <ScopeChip />
            <Badge variant="outline" className="text-xs">
              {roleLabels[role]}
            </Badge>
            <NotificationsDrawer />
            <ProfileMenu />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
