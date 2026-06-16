import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRole, roleLabels } from "@/contexts/RoleContext";
import { rolesForRoute } from "@/lib/permissions";

export function AccessRestricted() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useRole();
  const allowed = rolesForRoute(location.pathname) || [];

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full shadow-none">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Access restricted</h2>
            <p className="text-sm text-muted-foreground">
              Your current role <span className="font-medium text-foreground">{roleLabels[role]}</span> doesn’t have
              permission to view this page.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested path</span>
              <span className="font-mono text-foreground">{location.pathname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allowed roles</span>
              <span className="font-medium text-foreground">
                {allowed.length ? allowed.map(r => roleLabels[r]).join(", ") : "—"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <RefreshCw className="h-3 w-3" /> Use the role switcher in the sidebar to switch into an allowed role.
          </p>
          <div className="flex gap-2 justify-center pt-1">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Go back
            </Button>
            <Button onClick={() => navigate("/")}>Back to dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
