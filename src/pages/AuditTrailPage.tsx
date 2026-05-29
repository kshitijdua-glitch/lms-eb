import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, Download, Loader2 } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAudit } from "@/contexts/AuditContext";
import { toast } from "sonner";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";
import type { AuditEntry } from "@/types/lms";

const labelize = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

function toCSV(rows: AuditEntry[]): string {
  const header = ["timestamp", "actor", "role", "action", "entity_type", "entity_id", "reason"];
  const body = rows.map(r => [
    new Date(r.timestamp).toISOString(), r.actorName, r.actorRole, r.action,
    r.entityType, r.entityId, r.reason ?? "",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return [header.join(","), ...body].join("\n");
}

const AuditTrailPage = () => {
  const { role } = useRole();
  const { entries, loading } = useAudit();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const actionTypes = useMemo(() => ["All", ...Array.from(new Set(entries.map(e => e.action)))], [entries]);
  const roles = useMemo(() => ["All", ...Array.from(new Set(entries.map(e => e.actorRole)))], [entries]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (actionFilter !== "All" && e.action !== actionFilter) return false;
      if (roleFilter !== "All" && e.actorRole !== roleFilter) return false;
      const target = `${e.actorName} ${e.entityType} ${e.entityId}`.toLowerCase();
      if (search && !target.includes(search.toLowerCase())) return false;
      if (dateFrom && new Date(e.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.timestamp) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [entries, search, actionFilter, roleFilter, dateFrom, dateTo]);

  const handleExport = () => {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} entries`);
  };

  const columns: ColumnDef<AuditEntry>[] = [
    { id: "timestamp", label: "Timestamp", render: (e) => <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</span> },
    { id: "actor", label: "Actor", render: (e) => <span className="font-medium text-sm">{e.actorName}</span> },
    { id: "role", label: "Role", render: (e) => <Badge variant="secondary" className="text-[10px]">{labelize(e.actorRole)}</Badge> },
    { id: "action", label: "Action", render: (e) => <Badge variant="outline" className="text-[10px]">{labelize(e.action)}</Badge> },
    { id: "entity", label: "Entity", render: (e) => <span className="text-sm">{e.entityType}<span className="text-muted-foreground"> · {e.entityId.slice(0, 8)}</span></span> },
    { id: "reason", label: "Reason", render: (e) => <span className="text-xs text-muted-foreground max-w-[280px] truncate block">{e.reason || "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" /> Audit Trail</h1>
          <p className="text-muted-foreground text-sm">Immutable log of all system actions.{role !== "data_admin" && " No export available."}</p>
        </div>
        {role === "data_admin" && (
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search actor or entity..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>{actionTypes.map(a => <SelectItem key={a} value={a}>{a === "All" ? "All Actions" : labelize(a)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r === "All" ? "All Roles" : labelize(r)}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" aria-label="From date" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" aria-label="To date" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log…
            </div>
          ) : (
            <ConfigurableTable tableId="audit-trail" columns={columns} data={filtered} />
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {entries.length} entries{role !== "data_admin" && " · Export disabled per policy"}
      </div>
    </div>
  );
};

export default AuditTrailPage;
