import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertTriangle, Users, Send, MessageSquare, CheckCircle } from "lucide-react";
import { mockNotifications } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

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
};

export function NotificationsDrawer() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
          {notifications.map(n => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`flex gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}
                onClick={() => {
                  markRead(n.id);
                  if (n.leadId) {
                    setOpen(false);
                    navigate(`/leads/${n.leadId}`);
                  }
                }}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  n.type.includes("missed") || n.type.includes("expiry") ? "bg-destructive/10 text-destructive"
                  : n.type.includes("consent") || n.type.includes("stb") ? "bg-success/10 text-success"
                  : "bg-primary/10 text-primary"
                }`}>
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
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
