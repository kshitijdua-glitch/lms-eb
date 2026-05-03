import { useRole, roleLabels } from "@/contexts/RoleContext";
import { useAuth, DEMO_CREDENTIALS } from "@/contexts/AuthContext";
import { UserRole } from "@/types/lms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

/**
 * Demo Mode banner — replaces the production sidebar role switcher.
 * Always visible when authenticated, and makes it explicit that role
 * switching is a demo affordance, not a production control.
 */
export function DemoModeBanner() {
  const { role, setRole } = useRole();
  const { user, updateRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const handleRoleChange = (v: string) => {
    const next = v as UserRole;
    setRole(next);
    updateRole(next);

    // Switch demo identity to match the role so name/email/footer stay consistent.
    const cred = DEMO_CREDENTIALS.find(c => c.role === next);
    if (cred && user && user.email !== cred.email) {
      try {
        localStorage.setItem(
          "lms-auth",
          JSON.stringify({ name: cred.name, email: cred.email, role: cred.role, joinedAt: cred.joinedAt }),
        );
        // Force re-read by dispatching a storage event for AuthProvider listener.
        window.dispatchEvent(new StorageEvent("storage", { key: "lms-auth" }));
      } catch { /* noop */ }
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="flex items-center gap-3 px-4 py-1.5 text-xs">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span className="font-medium">Demo Mode</span>
        <span className="text-amber-700">
          You are previewing the LMS as <span className="font-semibold">{roleLabels[role]}</span>. Role switching is for prototype review only.
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-amber-700">Switch role:</span>
          <Select value={role} onValueChange={handleRoleChange}>
            <SelectTrigger className="h-7 w-40 bg-white border-amber-300 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as UserRole[]).map(r => (
                <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
