import { agents, teams } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AgentManagementPage = () => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground text-sm">{agents.length} agents across {teams.length} teams</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Add Agent</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Converted</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.teamName}</Badge></TableCell>
                  <TableCell className="text-sm">{a.managerName || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "active" ? "default" : "secondary"} className="text-xs">{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{a.leadsAssigned}</TableCell>
                  <TableCell className="text-right">{a.leadsConverted}</TableCell>
                  <TableCell className="text-right">
                    {a.leadsAssigned > 0 ? `${Math.round((a.leadsConverted / a.leadsAssigned) * 100)}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => toast.info("Edit agent: " + a.name)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Agent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input placeholder="Agent name" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="agent@lms.com" /></div>
            <div><Label>Phone</Label><Input placeholder="10-digit mobile" /></div>
            <div>
              <Label>Team</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { setShowCreate(false); toast.success("Agent created"); }}>Create Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentManagementPage;
