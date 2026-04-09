import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { leads, agents, teams } from "@/data/mockData";
import { Upload, FileText, Users, Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LeadUploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const unallocated = leads.filter(l => l.stage === "new");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [allocationMode, setAllocationMode] = useState("round_robin");

  const toggleLead = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Upload & Allocation</h1>
        <p className="text-muted-foreground text-sm">Upload CSV files and allocate leads to agents</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Upload Leads (CSV)</CardTitle></CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); toast.success("File uploaded! 25 leads imported (3 duplicates skipped)"); }}
          >
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Drag & drop your CSV file here, or click to browse</p>
            <Button variant="outline" onClick={() => toast.success("File uploaded! 25 leads imported (3 duplicates skipped)")}>
              <FileText className="h-4 w-4 mr-1" /> Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Required columns: Name, Mobile, Product Type, City, Income</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lead Pool — Unallocated ({unallocated.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={allocationMode} onValueChange={setAllocationMode}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="manual">Manual Assign</SelectItem>
                </SelectContent>
              </Select>
              {allocationMode === "manual" && (
                <Select>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Select Agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.filter(a => a.status === "active" && a.leadsAssigned > 0).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" disabled={selectedLeads.length === 0} onClick={() => { setSelectedLeads([]); toast.success(`${selectedLeads.length} leads allocated via ${allocationMode}`); }}>
                <Shuffle className="h-3 w-3 mr-1" /> Allocate ({selectedLeads.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Dedup</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unallocated.slice(0, 15).map(l => (
                <TableRow key={l.id}>
                  <TableCell><Checkbox checked={selectedLeads.includes(l.id)} onCheckedChange={() => toggleLead(l.id)} /></TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.mobile}</TableCell>
                  <TableCell className="text-sm">{l.city}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.source}</Badge></TableCell>
                  <TableCell><Badge className="text-xs bg-success text-success-foreground">Clean</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadUploadPage;
