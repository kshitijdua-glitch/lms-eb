import { PartnerSubmissionsBoard } from "@/components/PartnerSubmissionsBoard";
import { useRole } from "@/contexts/RoleContext";

const STBPage = () => {
  const { role } = useRole();
  return (
    <PartnerSubmissionsBoard
      scope={role === "agent" ? "agent" : role === "manager" ? "team" : "org"}
      title="Lending Partner Submissions"
      tableId="stb"
    />
  );
};

export default STBPage;
