import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ReactElement, Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import { PriorityConfigProvider } from "@/contexts/PriorityConfigContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { PartnersProvider } from "@/contexts/PartnersContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LmsDataProvider } from "@/contexts/LmsDataContext";
import LoginPage from "./pages/LoginPage";
import { AppLayout } from "@/components/AppLayout";
import { RouteGuard } from "@/components/RouteGuard";
import { PageSkeleton } from "@/components/PageSkeleton";
import Index from "./pages/Index";
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import STBPage from "./pages/STBPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const LeadUploadPage = lazy(() => import("./pages/admin/LeadUploadPage"));
const AgentManagementPage = lazy(() => import("./pages/admin/AgentManagementPage"));
const ConfigPage = lazy(() => import("./pages/admin/ConfigPage"));
const PartnersPage = lazy(() => import("./pages/admin/PartnersPage"));
const LeadPoolsPage = lazy(() => import("./pages/admin/LeadPoolsPage"));
const MISExportPage = lazy(() => import("./pages/admin/MISExportPage"));
const AdminStaffPage = lazy(() => import("./pages/admin/AdminStaffPage"));
const PerformancePage = lazy(() => import("./pages/PerformancePage"));
const GroupLeadsPage = lazy(() => import("./pages/GroupLeadsPage"));
const GroupFollowUpsPage = lazy(() => import("./pages/GroupFollowUpsPage"));
const GroupSTBPage = lazy(() => import("./pages/GroupSTBPage"));
const GroupManagementPage = lazy(() => import("./pages/GroupManagementPage"));
const GroupReportsPage = lazy(() => import("./pages/GroupReportsPage"));
const OrgLeadsPage = lazy(() => import("./pages/OrgLeadsPage"));
const OrgFollowUpsPage = lazy(() => import("./pages/OrgFollowUpsPage"));
const OrgSTBPage = lazy(() => import("./pages/OrgSTBPage"));
const OrgReportsPage = lazy(() => import("./pages/OrgReportsPage"));
const StaffManagementPage = lazy(() => import("./pages/StaffManagementPage"));
const SystemConfigPage = lazy(() => import("./pages/SystemConfigPage"));
const LeadAllocationPage = lazy(() => import("./pages/LeadAllocationPage"));
const AuditTrailPage = lazy(() => import("./pages/AuditTrailPage"));


const queryClient = new QueryClient();

const guard = (el: ReactElement) => <RouteGuard>{el}</RouteGuard>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <RoleProvider>
        <AuditProvider>
          <PartnersProvider>
          <PriorityConfigProvider>
          <LmsDataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/*"
                  element={
                    <AppLayout>
                      <Suspense fallback={<PageSkeleton />}>
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
          </LmsDataProvider>
          </PriorityConfigProvider>
          </PartnersProvider>
        </AuditProvider>
      </RoleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
