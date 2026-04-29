import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { isRouteAllowed } from "@/lib/permissions";
import { AccessRestricted } from "./AccessRestricted";

export function RouteGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { role } = useRole();
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isRouteAllowed(role, location.pathname)) {
    return <AccessRestricted />;
  }
  return <>{children}</>;
}
