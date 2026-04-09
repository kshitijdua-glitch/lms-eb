import { useParams, useNavigate } from "react-router-dom";
import { leads, getDispositionLabel, getStageLabel, getProductLabel, agents, dispositionConfigs } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Phone, Send, Calculator, Clock, CheckCircle, XCircle, AlertTriangle, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const lead = leads.find(l => l.id === id);
  const [showCallLog, setShowCallLog] = useState(false);
  const [showEMI, setShowEMI] = useState(false);
  const [emiAmount, setEmiAmount] = useState("");
  const [emiRate, setEmiRate] = useState("");
  const [emiTenure, setEmiTenure] = useState("");

  if (!lead) return <div className="p-8 text-center text-muted-foreground">Lead not found</div>;

  const daysSinceAlloc = Math.floor((Date.now() - new Date(lead.allocatedAt).getTime()) / 86400000);

  const emi = emiAmount && emiRate && emiTenure ? (() => {
    const p = parseFloat(emiAmount);
    const r = parseFloat(emiRate) / 12 / 100;
    const n = parseInt(emiTenure);
    if (!p || !r || !n) return 0;
    return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  })() : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{lead.id}</Badge>
            <Badge>{getStageLabel(lead.stage)}</Badge>
            <Badge variant={lead.priority === "hot" ? "destructive" : lead.priority === "warm" ? "default" : "secondary"}>
              {lead.priority.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCallLog(true)}><Phone className="h-4 w-4 mr-1" /> Log Call</Button>
          <Button variant="outline" onClick={() => toast.success("STB initiated for " + lead.name)}><Send className="h-4 w-4 mr-1" /> Send to Bank</Button>
          <Button variant="outline" onClick={() => setShowEMI(true)}><Calculator className="h-4 w-4 mr-1" /> EMI Calc</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Customer Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Mobile", lead.mobile],
              ["PAN", lead.pan],
              ["DOB", new Date(lead.dob).toLocaleDateString()],
              ["City", lead.city],
              ["Employment", lead.employmentType.replace("_", " ")],
              ["Monthly Income", `₹${lead.monthlyIncome.toLocaleString()}`],
              ["Obligations", `₹${lead.existingObligations.toLocaleString()}`],
              ["FOIR", `${lead.foir}%`],
              ["Product", getProductLabel(lead.productType)],
              ["Loan Amount", `₹${lead.loanAmount.toLocaleString()}`],
              ["Source", lead.source],
              ["Days Since Alloc", `${daysSinceAlloc} days`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bureau + BRE */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Bureau Report</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Credit Score</span>
                <span className={`text-3xl font-bold ${(lead.creditScore || 0) >= 700 ? "text-success" : (lead.creditScore || 0) >= 650 ? "text-warning" : "text-destructive"}`}>
                  {lead.creditScore || "N/A"}
                </span>
              </div>
              <Badge variant={lead.bureauStatus === "pulled" ? "default" : "secondary"}>
                {lead.bureauStatus === "pulled" ? "Report Available" : "Not Pulled"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">BRE Eligibility</CardTitle></CardHeader>
            <CardContent>
              {lead.breResult ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-success flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Eligible ({lead.breResult.eligiblePartners.length})
                  </div>
                  {lead.breResult.eligiblePartners.map(p => (
                    <div key={p.partnerId} className="p-2 rounded border text-sm">
                      <div className="font-medium">{p.partnerName}</div>
                      <div className="text-muted-foreground text-xs">Up to ₹{(p.maxAmount / 100000).toFixed(1)}L @ {p.minRate}% for {p.tenure}mo</div>
                    </div>
                  ))}
                  {lead.breResult.ineligiblePartners.length > 0 && (
                    <>
                      <div className="text-sm font-medium text-destructive flex items-center gap-1 mt-3">
                        <XCircle className="h-3 w-3" /> Ineligible ({lead.breResult.ineligiblePartners.length})
                      </div>
                      {lead.breResult.ineligiblePartners.map(p => (
                        <div key={p.partnerId} className="p-2 rounded border border-destructive/20 text-sm">
                          <div className="font-medium">{p.partnerName}</div>
                          <div className="text-destructive text-xs">{p.reason}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">BRE not yet run for this lead</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* STB + Consent + Follow-ups */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Consent & STB Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consent</span>
                <Badge variant={lead.consentStatus === "received" ? "default" : "secondary"}>
                  {lead.consentStatus.replace("_", " ")}
                </Badge>
              </div>
              {lead.stbSubmissions.length > 0 ? (
                lead.stbSubmissions.map(s => (
                  <div key={s.id} className="p-3 rounded-lg border space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">{s.partnerName}</span>
                      <Badge variant={s.status === "disbursed" ? "default" : s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-xs">
                        {s.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Submitted: {new Date(s.submittedAt).toLocaleDateString()}</div>
                    {s.approvedAmount && <div className="text-xs">Approved: ₹{s.approvedAmount.toLocaleString()}</div>}
                    {s.disbursedAmount && <div className="text-xs text-success">Disbursed: ₹{s.disbursedAmount.toLocaleString()}</div>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No STB submissions yet</p>
              )}
            </CardContent>
          </Card>

          {lead.retryCount > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Retry Status</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm">Retry Count: <strong>{lead.retryCount}</strong>/5</div>
                {lead.retryCount >= 5 && <Badge variant="destructive" className="mt-2">Escalated to TL</Badge>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* History Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Activity History</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="calls">
            <TabsList>
              <TabsTrigger value="calls">Call Logs ({lead.callLogs.length})</TabsTrigger>
              <TabsTrigger value="followups">Follow-Ups ({lead.followUps.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="calls" className="mt-4">
              <div className="space-y-3">
                {lead.callLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(cl => (
                  <div key={cl.id} className="flex gap-4 p-3 rounded-lg border">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${cl.outcome === "connected" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{cl.outcome === "connected" ? "Connected" : "Not Connected"}</span>
                        <Badge variant="outline" className="text-xs">{getDispositionLabel(cl.disposition)}</Badge>
                        <span className="text-xs text-muted-foreground">{Math.floor(cl.duration / 60)}m {cl.duration % 60}s</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{cl.notes}</p>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{new Date(cl.timestamp).toLocaleString()}</span>
                        <Badge variant="outline" className="text-[10px]">{cl.agentName}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="followups" className="mt-4">
              <div className="space-y-3">
                {lead.followUps.map(fu => (
                  <div key={fu.id} className="flex gap-4 p-3 rounded-lg border">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${fu.status === "completed" ? "bg-success/10 text-success" : fu.status === "missed" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm capitalize">{fu.type.replace("_", " ")}</span>
                        <Badge variant={fu.status === "completed" ? "default" : fu.status === "missed" ? "destructive" : "secondary"} className="text-xs">{fu.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(fu.scheduledAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Call Log Dialog */}
      <Dialog open={showCallLog} onOpenChange={setShowCallLog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Call — {lead.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date & Time</Label><Input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} /></div>
              <div><Label>Duration (seconds)</Label><Input type="number" placeholder="120" /></div>
            </div>
            <div>
              <Label>Outcome</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="not_connected">Not Connected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Disposition</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select disposition" /></SelectTrigger>
                <SelectContent>
                  {dispositionConfigs.map(d => (
                    <SelectItem key={d.type} value={d.type}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea placeholder="Call notes..." /></div>
            <div>
              <Label>Next Action</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Schedule Follow-Up</SelectItem>
                  <SelectItem value="stb">Initiate STB</SelectItem>
                  <SelectItem value="close">Close Lead</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallLog(false)}>Cancel</Button>
            <Button onClick={() => { setShowCallLog(false); toast.success("Call logged successfully"); }}>Save Call Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMI Calculator */}
      <Dialog open={showEMI} onOpenChange={setShowEMI}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>EMI Calculator</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Loan Amount (₹)</Label><Input type="number" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} placeholder="500000" /></div>
            <div><Label>Interest Rate (% p.a.)</Label><Input type="number" value={emiRate} onChange={e => setEmiRate(e.target.value)} placeholder="12" /></div>
            <div><Label>Tenure (months)</Label><Input type="number" value={emiTenure} onChange={e => setEmiTenure(e.target.value)} placeholder="36" /></div>
            {emi > 0 && (
              <div className="p-4 rounded-lg bg-primary/5 text-center">
                <div className="text-sm text-muted-foreground">Monthly EMI</div>
                <div className="text-3xl font-bold text-primary">₹{emi.toLocaleString()}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadDetailPage;
