import { Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, roleLabels } from "@/contexts/RoleContext";
import { can } from "@/lib/permissions";
import { toast } from "@/hooks/use-toast";

function initialsOf(name: string) {
  return name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user) return null;
  const initials = initialsOf(user.name);
  const canConfigure = can.configureSystem(role);

  const handleLogout = () => {
    logout();
    toast({ title: "Signed out", description: "You have been signed out." });
    navigate("/login", { replace: true });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="h-8 w-8 rounded-full bg-primary flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-opacity"
          >
            <span className="text-primary-foreground text-xs font-medium">{initials}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <Badge variant="outline" className="mt-1 w-fit text-[10px]">
                {roleLabels[role]}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          {canConfigure && (
            <DropdownMenuItem asChild>
              <Link to="/system-config">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your profile</DialogTitle>
            <DialogDescription>Read-only profile details for the current session.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 py-2">
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-base font-medium">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold truncate">{user.name}</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-sm border-t border-border pt-4">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="col-span-2 font-medium">{roleLabels[role]}</dd>
            <dt className="text-muted-foreground">Joined</dt>
            <dd className="col-span-2 font-medium">{user.joinedAt}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="col-span-2"><Badge variant="outline" className="text-[10px]">Active</Badge></dd>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
