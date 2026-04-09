import { lendingPartners, getProductLabel } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";

const PartnersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lending Partners</h1>
          <p className="text-muted-foreground text-sm">{lendingPartners.length} partners configured</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1" /> Add Partner</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Integration</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Min Score</TableHead>
                <TableHead>Max FOIR</TableHead>
                <TableHead>Min Income</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lendingPartners.map(lp => (
                <TableRow key={lp.id}>
                  <TableCell className="font-medium">{lp.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs uppercase">{lp.integrationType}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lp.products.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{getProductLabel(p)}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{lp.minCreditScore}</TableCell>
                  <TableCell>{lp.maxFoir}%</TableCell>
                  <TableCell>₹{lp.minIncome.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={lp.status === "active" ? "default" : "secondary"} className="text-xs">{lp.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => toast.info("Edit: " + lp.name)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnersPage;
