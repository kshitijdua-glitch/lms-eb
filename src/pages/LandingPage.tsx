import { Link } from "react-router-dom";
import { ArrowRight, Workflow, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import logoUrl from "@/assets/logo.png";

const features = [
  {
    icon: Workflow,
    title: "Lead Lifecycle",
    description: "Capture, qualify, follow up, and submit leads to partner banks in one streamlined flow.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Tailored portals for Agents, Team Leaders, Managers, Cluster Heads, and Data Admins.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Built-In",
    description: "PII masking, consent capture, and an immutable audit trail for every interaction.",
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const ctaTo = isAuthenticated ? "/app" : "/login";
  const ctaLabel = isAuthenticated ? "Enter LMS" : "Sign in";
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="w-full border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center overflow-hidden ring-1 ring-border shadow-sm">
              <img src={logoUrl} alt="Smart LMS logo" className="h-5 w-5 object-contain" />
            </div>
            <span className="font-semibold text-base tracking-tight">Smart LMS</span>
          </Link>
          <Button asChild size="sm">
            <Link to={ctaTo}>
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 relative overflow-hidden">
        {/* soft background tint */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)",
          }}
        />

        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Lead Management System
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight max-w-3xl mx-auto">
            One platform for the entire lead lifecycle.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Capture, qualify, follow up, and send leads to partner banks — with
            role-based control across Agents, Managers, Cluster Heads, and Data Admins.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to={ctaTo}>
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to={ctaTo}>{isAuthenticated ? "View dashboard" : "Explore as demo user"}</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="bg-card">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <span>Prototype • Mock data</span>
          <span>© {new Date().getFullYear()} Smart LMS</span>
        </div>
      </footer>
    </div>
  );
}
