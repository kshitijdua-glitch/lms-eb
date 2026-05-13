import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useRole, roleLabels } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import { NotificationsDrawer } from "@/components/NotificationsDrawer";
import { ProfileMenu } from "@/components/ProfileMenu";
import { DemoModeBanner } from "@/components/DemoModeBanner";

import { SkipLink } from "@/components/SkipLink";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = useRole();

  return (
    <SidebarProvider>
      <SkipLink />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DemoModeBanner />
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <div className="flex-1" />
            
            <Badge variant="outline" className="text-xs" aria-label={`Current role ${roleLabels[role]}`}>
              {roleLabels[role]}
            </Badge>
            <NotificationsDrawer />
            <ProfileMenu />
          </header>
          <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto p-6 focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
