import { useRole } from "@/contexts/RoleContext";
import { AgentDashboard } from "@/components/dashboards/AgentDashboard";
import { TLDashboard } from "@/components/dashboards/TLDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { ClusterHeadDashboard } from "@/components/dashboards/ClusterHeadDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

const Index = () => {
  const { role } = useRole();

  switch (role) {
    case "agent": return <AgentDashboard />;
    case "team_leader": return <TLDashboard />;
    case "manager": return <ManagerDashboard />;
    case "cluster_head": return <ClusterHeadDashboard />;
    case "data_admin": return <AdminDashboard />;
  }
};

export default Index;
