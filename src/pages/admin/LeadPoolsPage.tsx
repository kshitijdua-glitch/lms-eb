import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Database, ArrowLeft } from "lucide-react";
import { ConfigurableTable } from "@/components/ConfigurableTable";
import type { ColumnDef } from "@/types/table";

type BatchRow = {
  id: string; name: string; source: string; product: string; uploadDate: string;
  uploadedBy: string; total: number; valid: number; rejected: number;
  status: string; allocatedTo: string; allocDate: string; bureau?: boolean;
};

const mockBatches: BatchRow[] = [
  { id: "b1", name: "Google_Ads_Apr10", source: "Google Ads", product: "Personal Loan", uploadDate: "2026-04-10", uploadedBy: "Admin", total: 250, valid: 238, rejected: 12, status: "Allocated", allocatedTo: "Vikram Mehta (Group)", allocDate: "2026-04-11" },
  { id: "b2", name: "Partner_HDFC_Apr08", source: "Partner", product: "Home Loan", uploadDate: "2026-04-08", uploadedBy: "Admin", total: 180, valid: 175, rejected: 5, status: "Partial", allocatedTo: "Priya Sharma (Team)", allocDate: "2026-04-09" },
  { id: "b3", name: "Website_Apr06", source: "Website", product: "Personal Loan", uploadDate: "2026-04-06", uploadedBy: "Admin", total: 320, valid: 305, rejected: 15, status: "Unallocated", allocatedTo: "—", allocDate: "—" },
  { id: "b4", name: "Facebook_Apr04", source: "Facebook", product: "Credit Card", uploadDate: "2026-04-04", uploadedBy: "Admin", total: 150, valid: 142, rejected: 8, status: "Allocated", allocatedTo: "Anjali Kapoor (Group)", allocDate: "2026-04-05" },
  { id: "b5", name: "IVR_Apr02", source: "IVR", product: "Business Loan", uploadDate: "2026-04-02", uploadedBy: "Admin", total: 90, valid: 88, rejected: 2, status: "Unallocated", allocatedTo: "—", allocDate: "—" },
  { id: "b6", name: "Bureau_CIBIL_Apr01", source: "Bureau", product: "Personal Loan", uploadDate: "2026-04-01", uploadedBy: "Admin", total: 200, valid: 195, rejected: 5, status: "Allocated", allocatedTo: "Auto RR", allocDate: "2026-04-01", bureau: true },
];

const LeadPoolsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  const filtered = mockBatches.filter(b => {
    if (statusFilter !== "All" && b.status !== statusFilter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pool = selectedPool ? mockBatches.find(b => b.id === selectedPool) : null;

  if (pool) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedPool(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Pools</Button>
        <div>
          <h1 className="text-2xl font-bold">{pool.name}</h1>
          <p className="text-muted-foreground text-sm">Uploaded {pool.uploadDate} by {pool.uploadedBy}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: "Total Rows", value: pool.total }, { label: "Valid", value: pool.valid }, { label: "Rejected", value: pool.rejected }, { label: "Status", value: pool.status }].map(k => (
            <Card key={k.label}><CardContent className="p-4 text-center"><div className="text-xl font-bold">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Allocation History</CardTitle></CardHeader>
          <CardContent>
            {pool.allocatedTo !== "—" ? (
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Allocated To:</span> {pool.allocatedTo}</div>
                <div><span className="text-muted-foreground">Allocation Date:</span> {pool.allocDate}</div>
                <div><span className="text-muted-foreground">Mode:</span> {pool.allocatedTo.includes("Auto") ? "Auto Round Robin" : "Manual"}</div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Not yet allocated</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pipeline Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-center text-sm">
              {[{ stage: "New", count: Math.round(pool.valid * 0.3) }, { stage: "Contacted", count: Math.round(pool.valid * 0.25) }, { stage: "Interested", count: Math.round(pool.valid * 0.2) }, { stage: "STB", count: Math.round(pool.valid * 0.15) }, { stage: "Disbursed", count: Math.round(pool.valid * 0.1) }].map(s => (
                <div key={s.stage} className="border rounded p-2"><div className="font-bold">{s.count}</div><div className="text-xs text-muted-foreground">{s.stage}</div></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns: ColumnDef<BatchRow>[] = [
    { id: "name", label: "Batch Name", render: (b) => (
      <span className="font-medium">{b.name}{b.bureau && <Badge className="ml-1 text-[9px]" variant="secondary">Bureau</Badge>}</span>
    )},
    { id: "source", label: "Source", render: (b) => <Badge variant="outline" className="text-[10px]">{b.source}</Badge> },
    { id: "product", label: "Product", render: (b) => <span className="text-sm">{b.product}</span> },
    { id: "uploadDate", label: "Upload Date", render: (b) => <span className="text-sm text-muted-foreground">{b.uploadDate}</span> },
    { id: "total", label: "Total", headerClassName: "text-right", render: (b) => <span className="text-right block">{b.total}</span> },
    { id: "valid", label: "Valid", headerClassName: "text-right", render: (b) => <span className="text-right text-green-600 block">{b.valid}</span> },
    { id: "rejected", label: "Rejected", headerClassName: "text-right", render: (b) => <span className="text-right text-red-600 block">{b.rejected}</span> },
    { id: "status", label: "Status", render: (b) => <Badge variant={b.status === "Allocated" ? "default" : b.status === "Partial" ? "secondary" : "outline"} className="text-[10px]">{b.status}</Badge> },
    { id: "allocatedTo", label: "Allocated To", render: (b) => <span className="text-sm text-muted-foreground">{b.allocatedTo}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="h-6 w-6" /> Lead Pools</h1>
        <p className="text-muted-foreground text-sm">All uploaded batches and their allocation status</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search batch name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{["All", "Unallocated", "Partial", "Allocated"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <ConfigurableTable tableId="lead-pools" columns={columns} data={filtered} onRowClick={(b) => setSelectedPool(b.id)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadPoolsPage;
