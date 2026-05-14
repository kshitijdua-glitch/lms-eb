import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, Clock, AlertTriangle, Users, Send, CheckCircle, X, Inbox } from "lucide-react";
import { getNotificationsForRole } from "@/data/mockData";
import { useRole } from "@/contexts/RoleContext";
import type { Notification } from "@/types/lms";

const iconMap: Record<string, any> = {
  follow_up_due: Clock,
  follow_up_missed: AlertTriangle,
  lead_expiry: AlertTriangle,
  lead_reassigned: Users,
  new_allocation: Users,
  stb_status_update: Send,
  slp_initiated: Send,
  slp_pending_update: Send,
  slp_approved: CheckCircle,
  slp_declined: AlertTriangle,
  slp_disbursed: CheckCircle,
  agent_missed_fu: AlertTriangle,
  nc_escalation: AlertTriangle,
  retry_exceeded: AlertTriangle,
  agent_not_logged_in: Users,
  staff_deactivated: Users,
  partner_changed: Send,
  stb_initiated_by_agent: Send,
  batch_uploaded: Inbox,
  allocation_done: Users,
  export_completed: CheckCircle,
  config_changed: AlertTriangle,
  lead_closed: CheckCircle,
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { role, currentAgentId, currentTeamId } = useRole();
  const initial = useMemo(() => getNotificationsForRole(role, currentAgentId, currentTeamId), [role, currentAgentId, currentTeamId]);
  const [notifications, setNotifications] = useState<Notification[]>(initial);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return notifications
      .filter(n => filter === "all" || !n.read)
      .filter(n => !search.trim() || `${n.title} ${n.message}`.toLowerCase().includes(search.toLowerCase()));
  }, [notifications, filter, search]);

  const unread = notifications.filter(n => !n.read).length;

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const handleClick = (n: Notification) => {
    markRead(n.id);
    const target = n.clickTarget || (n.leadId ? `/leads/${n.leadId}` : null);
    if (target) navigate(target);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1>Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unread} unread · {notifications.length} total
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>Unread</Button>
        <Input placeholder="Search notifications…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9 ml-auto" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
            You're all caught up
          </Card>
        )}
        {filtered.map(n => {
          const Icon = iconMap[n.type] || Bell;
          const tone = n.type.includes("missed") || n.type.includes("expiry") || n.type.includes("declined") || n.type.includes("nc_") || n.type.includes("retry_")
            ? "bg-destructive/10 text-destructive"
            : n.type.includes("approved") || n.type.includes("disbursed") || n.type.includes("export_completed")
              ? "bg-success/10 text-success"
              : "bg-primary/10 text-primary";
          return (
            <Card
              key={n.id}
              className={`flex gap-3 p-4 cursor-pointer hover:bg-accent/40 transition-colors ${!n.read ? "border-primary/30 bg-primary/5" : ""}`}
              onClick={() => handleClick(n)}
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{n.title}</span>
                  {!n.read && <Badge variant="outline" className="text-[10px]">New</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <span className="text-[10px] text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</span>
              </div>
              <button
                className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center self-start"
                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsPage;
