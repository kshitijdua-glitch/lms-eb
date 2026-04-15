import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { AppLayout } from "@/components/AppLayout";
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
import AdminAllocationPage from "./pages/admin/AdminAllocationPage";
import LeadPoolsPage from "./pages/admin/LeadPoolsPage";
import MISExportPage from "./pages/admin/MISExportPage";
import BureauCampaignPage from "./pages/admin/BureauCampaignPage";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RoleProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/leads/:id" element={<LeadDetailPage />} />
              <Route path="/follow-ups" element={<FollowUpsPage />} />
              <Route path="/stb" element={<STBPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/admin/upload" element={<LeadUploadPage />} />
              <Route path="/admin/agents" element={<AgentManagementPage />} />
              <Route path="/admin/config" element={<ConfigPage />} />
              <Route path="/admin/partners" element={<PartnersPage />} />
              <Route path="/admin/allocation" element={<AdminAllocationPage />} />
              <Route path="/admin/pools" element={<LeadPoolsPage />} />
              <Route path="/admin/mis" element={<MISExportPage />} />
              <Route path="/admin/bureau" element={<BureauCampaignPage />} />
              <Route path="/admin/staff" element={<AdminStaffPage />} />
              <Route path="/group-leads" element={<GroupLeadsPage />} />
              <Route path="/group-follow-ups" element={<GroupFollowUpsPage />} />
              <Route path="/group-stb" element={<GroupSTBPage />} />
              <Route path="/group-management" element={<GroupManagementPage />} />
              <Route path="/group-reports" element={<GroupReportsPage />} />
              <Route path="/org-leads" element={<OrgLeadsPage />} />
              <Route path="/org-follow-ups" element={<OrgFollowUpsPage />} />
              <Route path="/org-stb" element={<OrgSTBPage />} />
              <Route path="/org-reports" element={<OrgReportsPage />} />
              <Route path="/staff-management" element={<StaffManagementPage />} />
              <Route path="/system-config" element={<SystemConfigPage />} />
              <Route path="/lead-allocation" element={<LeadAllocationPage />} />
              <Route path="/audit-trail" element={<AuditTrailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
