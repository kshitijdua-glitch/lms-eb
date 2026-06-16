import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, Clock, AlertTriangle, Users, Send, CheckCircle, X, Inbox } from "lucide-react";
import { getNotificationsForRole } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import type { Notification } from "@/types/lms";

const iconMap: Record<string, any> = {
  follow_up_due: Clock,
  follow_up_missed: AlertTriangle,
  lead_expiry: AlertTriangle,
  consent_received: CheckCircle,
  lead_reassigned: Users,
  new_allocation: Users,
  stb_status_update: Send,
  agent_missed_fu: AlertTriangle,
  nc_escalation: AlertTriangle,
  agent_not_logged_in: Users,
  stb_initiated_by_agent: Send,
  batch_uploaded: Inbox,
  allocation_done: Users,
  export_completed: CheckCircle,
  config_changed: AlertTriangle,
};

export function NotificationsDrawer() {
  const navigate = useNavigate();
  const { role, currentAgentId, currentTeamId } = useRole();
  const initial = useMemo(() => getNotificationsForRole(role, currentAgentId, currentTeamId), [role, currentAgentId, currentTeamId]);
  const [notifications, setNotifications] = useState<Notification[]>(initial);
  const [open, setOpen] = useState(false);

  // Re-sync when role changes (the parent component remounts via key change too, but be defensive)
  useMemo(() => setNotifications(initial), [initial]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const handleClick = (n: Notification) => {
    markRead(n.id);
    const target = n.clickTarget || (n.leadId ? `/leads/${n.leadId}` : null);
    if (target) {
      setOpen(false);
      navigate(target);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[360px] sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>Mark all read</Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
              You're all caught up
            </div>
          )}
          {notifications.map(n => {
            const Icon = iconMap[n.type] || Bell;
            const tone = n.type.includes("missed") || n.type.includes("expiry") || n.type.includes("nc_")
              ? "bg-destructive/10 text-destructive"
              : n.type.includes("consent") || n.type.includes("approved") || n.type.includes("export_completed")
                ? "bg-success/10 text-success"
                : "bg-primary/10 text-primary";
            return (
              <div
                key={n.id}
                className={`group flex gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}
                onClick={() => handleClick(n)}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{n.title}</span>
                    {!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</span>
                </div>
                <button
                  className="h-6 w-6 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shrink-0"
                  onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
