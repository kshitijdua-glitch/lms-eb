import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Step = "upload" | "mapping" | "validation" | "done";

const systemFields = ["Name", "Mobile", "Email", "City", "Pin Code", "State", "Product Type", "Monthly Income", "Employment Type", "Company Name", "Lead Source", "DOB", "PAN"];
const sampleColumns = ["Full Name", "Phone Number", "Email Address", "Location", "Postal Code", "Product", "Salary", "Employer", "Source"];

const LeadUploadPage = () => {
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [mappings, setMappings] = useState<Record<string, string>>({
    "Full Name": "Name", "Phone Number": "Mobile", "Email Address": "Email",
    "Location": "City", "Postal Code": "Pin Code", "Product": "Product Type",
    "Salary": "Monthly Income", "Employer": "Company Name", "Source": "Lead Source",
  });

  const validationResult = { total: 250, valid: 238, invalid: 8, duplicates: 4 };
  const invalidRows = [
    { row: 12, field: "Mobile", reason: "Invalid phone format: 12345" },
    { row: 45, field: "Monthly Income", reason: "Non-numeric value: 'NA'" },
    { row: 78, field: "Email", reason: "Invalid email format" },
    { row: 102, field: "Mobile", reason: "Missing required field" },
    { row: 156, field: "Pin Code", reason: "Invalid PIN: 9999" },
    { row: 189, field: "Monthly Income", reason: "Negative value: -5000" },
    { row: 210, field: "Name", reason: "Empty field" },
    { row: 233, field: "Mobile", reason: "Duplicate with row 12" },
  ];

  const handleUpload = () => {
    setFileName("Google_Ads_Apr14.csv");
    setStep("mapping");
    toast.info("File parsed — 250 rows detected. Map columns now.");
  };

  const handleMapping = (col: string, sysField: string) => {
    setMappings(prev => ({ ...prev, [col]: sysField }));
  };

  const handleValidate = () => {
    setStep("validation");
    toast.info("Validation complete — review results below.");
  };

  const handleIngest = () => {
    setStep("done");
    toast.success(`${validationResult.valid} leads ingested. Batch created: "Google_Ads_Apr14" — Awaiting Allocation.`);
  };

  if (step === "done") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Upload</h1>
          <p className="text-muted-foreground text-sm">Upload CSV/XLSX files and validate before ingestion</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold">Upload Complete</h2>
            <p className="text-muted-foreground">{validationResult.valid} leads ingested into batch "Google_Ads_Apr14"</p>
            <p className="text-sm text-muted-foreground">Status: <Badge>Awaiting Allocation</Badge></p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => { setStep("upload"); setFileName(""); }}>Upload Another File</Button>
              <Button variant="outline" onClick={() => window.location.href = "/admin/allocation"}>Go to Allocation</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Upload</h1>
        <p className="text-muted-foreground text-sm">Upload CSV/XLSX files (max 50MB) and validate before ingestion</p>
      </div>

      <div className="flex gap-4 text-sm">
        {["upload", "mapping", "validation"].map((s, i) => (
          <div key={s} className={`flex items-center gap-1 ${step === s ? "font-bold text-primary" : s === "upload" && step !== "upload" ? "text-green-600" : "text-muted-foreground"}`}>
            <span className="h-6 w-6 rounded-full border flex items-center justify-center text-xs">{i + 1}</span>
            {s === "upload" ? "Upload" : s === "mapping" ? "Column Mapping" : "Validation"}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Upload File (CSV / XLSX)</CardTitle></CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(); }}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Drag & drop your CSV or XLSX file here, or click to browse</p>
              <Button variant="outline" onClick={handleUpload}>
                <FileText className="h-4 w-4 mr-1" /> Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Max file size: 50MB. Required: Name, Mobile, Product Type</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "mapping" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Column Mapping — {fileName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Map your uploaded columns to system fields. Unmapped columns will be ignored.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uploaded Column</TableHead>
                  <TableHead>System Field</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleColumns.map(col => (
                  <TableRow key={col}>
                    <TableCell className="font-medium">{col}</TableCell>
                    <TableCell>
                      <Select value={mappings[col] || ""} onValueChange={v => handleMapping(col, v)}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Select field" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__skip">— Skip —</SelectItem>
                          {systemFields.map(sf => <SelectItem key={sf} value={sf}>{sf}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {mappings[col] && mappings[col] !== "__skip" ? (
                        <Badge className="text-[10px] bg-green-100 text-green-700">Mapped</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Unmapped</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex gap-2">
              <Button onClick={handleValidate}>Validate Data</Button>
              <Button variant="outline" onClick={() => { setStep("upload"); setFileName(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "validation" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{validationResult.total}</div>
              <div className="text-xs text-muted-foreground">Total Rows</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">{validationResult.valid}</div>
              <div className="text-xs text-muted-foreground">Valid</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-600">{validationResult.invalid}</div>
              <div className="text-xs text-muted-foreground">Invalid</div>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-600">{validationResult.duplicates}</div>
              <div className="text-xs text-muted-foreground">Duplicates</div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Rejected Rows</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row #</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invalidRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.row}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{r.field}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleIngest}>
              <CheckCircle className="h-4 w-4 mr-1" /> Ingest {validationResult.valid} Valid Rows
            </Button>
            <Button variant="outline" onClick={() => toast.success("Rejected rows CSV downloaded")}>
              <Download className="h-4 w-4 mr-1" /> Download Rejected Rows
            </Button>
            <Button variant="ghost" onClick={() => { setStep("upload"); setFileName(""); }}>Cancel Upload</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadUploadPage;
