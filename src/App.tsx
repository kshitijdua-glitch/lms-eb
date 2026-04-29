import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ReactElement } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { PriorityConfigProvider } from "@/contexts/PriorityConfigContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { PartnersProvider } from "@/contexts/PartnersContext";
import { AppLayout } from "@/components/AppLayout";
import { RouteGuard } from "@/components/RouteGuard";
import Index from "./pages/Index";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import STBPage from "./pages/STBPage";
import ReportsPage from "./pages/ReportsPage";
import LeadUploadPage from "./pages/admin/LeadUploadPage";
import AgentManagementPage from "./pages/admin/AgentManagementPage";
import ConfigPage from "./pages/admin/ConfigPage";
import PartnersPage from "./pages/admin/PartnersPage";
import LeadPoolsPage from "./pages/admin/LeadPoolsPage";
import MISExportPage from "./pages/admin/MISExportPage";

import AdminStaffPage from "./pages/admin/AdminStaffPage";
import PerformancePage from "./pages/PerformancePage";
import GroupLeadsPage from "./pages/GroupLeadsPage";
import GroupFollowUpsPage from "./pages/GroupFollowUpsPage";
import GroupSTBPage from "./pages/GroupSTBPage";
import GroupManagementPage from "./pages/GroupManagementPage";
import GroupReportsPage from "./pages/GroupReportsPage";
import OrgLeadsPage from "./pages/OrgLeadsPage";
import OrgFollowUpsPage from "./pages/OrgFollowUpsPage";
import OrgSTBPage from "./pages/OrgSTBPage";
import OrgReportsPage from "./pages/OrgReportsPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import SystemConfigPage from "./pages/SystemConfigPage";
import LeadAllocationPage from "./pages/LeadAllocationPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const guard = (el: ReactElement) => <RouteGuard>{el}</RouteGuard>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <AuditProvider>
          <PartnersProvider>
          <PriorityConfigProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                  path="/*"
                  element={
                    <AppLayout>
                      <Routes>
                        <Route path="/app" element={guard(<Index />)} />
                        <Route path="/leads" element={guard(<LeadsPage />)} />
                        <Route path="/leads/:id" element={guard(<LeadDetailPage />)} />
                        <Route path="/follow-ups" element={guard(<FollowUpsPage />)} />
                        <Route path="/stb" element={guard(<STBPage />)} />
                        <Route path="/performance" element={guard(<PerformancePage />)} />
                        <Route path="/reports" element={guard(<ReportsPage />)} />
                        <Route path="/admin/upload" element={guard(<LeadUploadPage />)} />
                        <Route path="/admin/agents" element={guard(<AgentManagementPage />)} />
                        <Route path="/admin/config" element={guard(<ConfigPage />)} />
                        <Route path="/admin/partners" element={guard(<PartnersPage />)} />
                        <Route path="/admin/allocation" element={guard(<LeadAllocationPage />)} />
                        <Route path="/admin/pools" element={guard(<LeadPoolsPage />)} />
                        <Route path="/admin/mis" element={guard(<MISExportPage />)} />
                        <Route path="/admin/staff" element={guard(<AdminStaffPage />)} />
                        <Route path="/group-leads" element={guard(<GroupLeadsPage />)} />
                        <Route path="/group-follow-ups" element={guard(<GroupFollowUpsPage />)} />
                        <Route path="/group-stb" element={guard(<GroupSTBPage />)} />
                        <Route path="/group-management" element={guard(<GroupManagementPage />)} />
                        <Route path="/group-reports" element={guard(<GroupReportsPage />)} />
                        <Route path="/org-leads" element={guard(<OrgLeadsPage />)} />
                        <Route path="/org-follow-ups" element={guard(<OrgFollowUpsPage />)} />
                        <Route path="/org-stb" element={guard(<OrgSTBPage />)} />
                        <Route path="/org-reports" element={guard(<OrgReportsPage />)} />
                        <Route path="/staff-management" element={guard(<StaffManagementPage />)} />
                        <Route path="/system-config" element={guard(<SystemConfigPage />)} />
                        <Route path="/lead-allocation" element={guard(<LeadAllocationPage />)} />
                        <Route path="/audit-trail" element={guard(<AuditTrailPage />)} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  }
                />
              </Routes>
            </BrowserRouter>
          </PriorityConfigProvider>
          </PartnersProvider>
        </AuditProvider>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
