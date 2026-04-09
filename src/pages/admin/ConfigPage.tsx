import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { dispositionConfigs, lendingPartners, getProductLabel } from "@/data/mockData";
import { Edit, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

const ConfigPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuration</h1>
        <p className="text-muted-foreground text-sm">System settings and rules management</p>
      </div>

      <Tabs defaultValue="dispositions">
        <TabsList>
          <TabsTrigger value="dispositions">Dispositions</TabsTrigger>
          <TabsTrigger value="bre">BRE Rules</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="dispositions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Disposition Categories</CardTitle>
                <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disposition</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Requires Follow-Up</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispositionConfigs.map(d => (
                    <TableRow key={d.type}>
                      <TableCell className="font-medium">{d.label}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{d.category.replace("_", " ")}</Badge></TableCell>
                      <TableCell><Switch checked={d.requiresFollowUp} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon"><Edit className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bre" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">BRE Rules by Partner</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Min Credit Score</TableHead>
                    <TableHead>Max FOIR</TableHead>
                    <TableHead>Min Income</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lendingPartners.map(lp => (
                    <TableRow key={lp.id}>
                      <TableCell className="font-medium">{lp.name}</TableCell>
                      <TableCell>{lp.minCreditScore}</TableCell>
                      <TableCell>{lp.maxFoir}%</TableCell>
                      <TableCell>₹{lp.minIncome.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lp.products.map(p => <Badge key={p} variant="outline" className="text-[10px]">{getProductLabel(p)}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => toast.info("Edit BRE: " + lp.name)}><Edit className="h-3 w-3" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Product Types</CardTitle>
                <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Product</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["personal_loan", "home_loan", "business_loan", "credit_card", "loan_against_property"].map(p => (
                  <div key={p} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium">{getProductLabel(p as any)}</span>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <Button variant="ghost" size="icon"><Edit className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPage;
