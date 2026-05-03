import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Compass, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.warn("404: route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="max-w-md w-full shadow-none">
        <CardContent className="p-8 space-y-5 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p className="text-sm text-muted-foreground">
              This page may have moved or may not be available for your role.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-mono">{location.pathname}</span>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
            <Button onClick={() => navigate("/app")}>Go to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
