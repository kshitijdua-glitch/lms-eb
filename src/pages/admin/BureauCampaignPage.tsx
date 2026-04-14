import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type Step = "form" | "validation" | "done";

const bureaus = ["CIBIL", "Experian", "CRIF", "Equifax"];

const BureauCampaignPage = () => {
  const [step, setStep] = useState<Step>("form");
  const [dragOver, setDragOver] = useState(false);
  const [bureau, setBureau] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDate, setCampaignDate] = useState("");

  const validationResult = { total: 200, valid: 195, invalid: 3, formatErrors: 2 };

  const handleUpload = () => {
    if (!bureau || !campaignName || !campaignDate) {
      toast.error("Please fill all bureau fields before uploading");
      return;
    }
    setStep("validation");
    toast.info("Bureau data validated — review results below.");
  };

  const handleIngest = () => {
    setStep("done");
    toast.success(`${validationResult.valid} bureau records ingested. Tagged as "${bureau} - ${campaignName}".`);
  };

  if (step === "done") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bureau Campaign Data</h1>
          <p className="text-muted-foreground text-sm">Upload bureau-specific campaign data</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold">Bureau Upload Complete</h2>
            <p className="text-muted-foreground">{validationResult.valid} records ingested — {bureau} / {campaignName}</p>
            <p className="text-sm text-muted-foreground">Batch tagged as <Badge variant="secondary">Bureau</Badge> in Lead Pools</p>
            <Button onClick={() => { setStep("form"); setBureau(""); setCampaignName(""); setCampaignDate(""); }}>Upload Another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bureau Campaign Data</h1>
        <p className="text-muted-foreground text-sm">Upload bureau-specific lead data with scores, pre-approvals, and grades</p>
      </div>

      {step === "form" && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Bureau Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Bureau Name *</Label>
                  <Select value={bureau} onValueChange={setBureau}>
                    <SelectTrigger><SelectValue placeholder="Select bureau" /></SelectTrigger>
                    <SelectContent>
                      {bureaus.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Campaign Name *</Label>
                  <Input placeholder="e.g. CIBIL_PL_Apr2026" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
                </div>
                <div>
                  <Label>Campaign Date *</Label>
                  <Input type="date" value={campaignDate} onChange={e => setCampaignDate(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Bureau file must include: Name, Mobile, Bureau Score, Pre-Approval Amount, Bureau Grade.
                Standard lead fields (City, Income, etc.) also required.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(); }}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">Drop bureau CSV/XLSX file here</p>
                <Button variant="outline" onClick={handleUpload}>
                  <FileText className="h-4 w-4 mr-1" /> Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "validation" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: validationResult.total, icon: null },
              { label: "Valid", value: validationResult.valid, color: "text-green-600", icon: CheckCircle },
              { label: "Invalid", value: validationResult.invalid, color: "text-red-600", icon: XCircle },
              { label: "Format Errors", value: validationResult.formatErrors, color: "text-yellow-600", icon: XCircle },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4 text-center">
                {k.icon && <k.icon className={`h-5 w-5 mx-auto mb-1 ${k.color}`} />}
                <div className={`text-2xl font-bold ${k.color || ""}`}>{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent></Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Sample Valid Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Bureau Score</TableHead>
                    <TableHead>Pre-Approval</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Rajesh K.", mobile: "XXXXXX3210", score: 745, amount: "₹5,00,000", grade: "A" },
                    { name: "Sunita D.", mobile: "XXXXXX4321", score: 680, amount: "₹3,00,000", grade: "B" },
                    { name: "Mohd I.", mobile: "XXXXXX5432", score: 720, amount: "₹4,50,000", grade: "A" },
                  ].map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.mobile}</TableCell>
                      <TableCell><Badge variant="outline">{r.score}</Badge></TableCell>
                      <TableCell>{r.amount}</TableCell>
                      <TableCell><Badge variant={r.grade === "A" ? "default" : "secondary"}>{r.grade}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleIngest}>
              <CheckCircle className="h-4 w-4 mr-1" /> Ingest {validationResult.valid} Records
            </Button>
            <Button variant="ghost" onClick={() => setStep("form")}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BureauCampaignPage;
