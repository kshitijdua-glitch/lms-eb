import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useRole, roleLabels } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import { NotificationsDrawer } from "@/components/NotificationsDrawer";
import { ProfileMenu } from "@/components/ProfileMenu";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role } = useRole();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-3 sm:px-4 gap-2 sm:gap-4 shrink-0 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1" />
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              {roleLabels[role]}
            </Badge>
            <NotificationsDrawer />
            <ProfileMenu />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}
