import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { isRouteAllowed } from "@/lib/permissions";
import { AccessRestricted } from "./AccessRestricted";

export function RouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { role } = useRole();
  if (!isRouteAllowed(role, location.pathname)) {
    return <AccessRestricted />;
  }
  return <>{children}</>;
}
