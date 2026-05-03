import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabels } from "@/contexts/RoleContext";
import { rolesForRoute } from "@/lib/permissions";

// Friendly label map for known routes; falls back to last URL segment.
const ROUTE_LABELS: Record<string, string> = {
  "/staff-management": "Staff Management",
  "/admin/staff": "Staff Management",
  "/admin/upload": "Lead Upload",
  "/admin/allocation": "Lead Allocation",
  "/admin/pools": "Lead Pools",
  "/admin/partners": "Lending Partners",
  "/admin/mis": "MIS Export",
  "/system-config": "System Configuration",
  "/audit-trail": "Audit Trail",
  "/group-management": "Group Management",
  "/org-leads": "Organisation Leads",
  "/org-follow-ups": "Organisation Follow-Ups",
  "/org-stb": "Organisation STB",
  "/org-reports": "Organisation Reports",
};

export function AccessRestricted() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const allowed = rolesForRoute(location.pathname) || [];
  const requested =
    ROUTE_LABELS[location.pathname] ||
    (location.pathname.split("/").filter(Boolean).pop() || location.pathname);

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full shadow-none">
        <CardContent className="p-8 space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-1.5 text-center">
            <h2 className="text-lg font-semibold">Access restricted</h2>
            <p className="text-sm text-muted-foreground">
              Your current account does not have permission to view this page.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested page</span>
              <span className="font-medium text-foreground capitalize">{requested}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allowed role{allowed.length > 1 ? "s" : ""}</span>
              <span className="font-medium text-foreground">
                {allowed.length ? allowed.map(r => roleLabels[r]).join(", ") : "—"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Ask your administrator for access if this is required.
          </p>
          <div className="flex gap-2 justify-center pt-1">
            <Button variant="outline" onClick={() => navigate("/app")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
