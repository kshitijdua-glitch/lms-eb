import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import logoUrl from "@/assets/logo.png";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok === false) {
      toast({ title: "Sign in failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back", description: `Signed in as ${email}` });
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="w-full border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center overflow-hidden ring-1 ring-border shadow-sm">
              <img src={logoUrl} alt="Smart LMS logo" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-semibold text-base tracking-tight">Smart LMS</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center px-6 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)" }}
        />
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to Smart LMS</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your work credentials to access the lead management portal.
            </p>
          </div>

          <Card className="bg-card shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email" type="email" autoComplete="email" required
                      placeholder="you@company.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password" type="password" autoComplete="current-password" required
                      placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="mt-5 pt-4 border-t border-border/60 text-xs text-muted-foreground text-center">
                New accounts are created by your Data Admin. Contact them if you need access.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
