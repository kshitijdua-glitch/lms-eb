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
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/admin/upload" element={<LeadUploadPage />} />
              <Route path="/admin/agents" element={<AgentManagementPage />} />
              <Route path="/admin/config" element={<ConfigPage />} />
              <Route path="/admin/partners" element={<PartnersPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
