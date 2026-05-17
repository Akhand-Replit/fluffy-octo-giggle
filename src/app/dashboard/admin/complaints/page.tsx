"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resolveComplaint, rejectComplaint, ComplaintData } from "@/lib/services/complaintService";
import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"active" | "resolved">("active");

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const q = query(
        collection(db, "complaints"),
        where("escalationLevel", "==", 3)
      );
      const snap = await getDocs(q);
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComplaintData));
      
      loaded.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setComplaints(loaded);
      setLoading(false);
    }
    loadData();
  }, [user]);

  const handleResolve = async (complaint: ComplaintData) => {
    if (!complaint.id) return;
    const res = resolutionText[complaint.id] || "";
    await resolveComplaint(complaint.id, res, user!.uid, "appAdmin");
    setComplaints(prev => prev.map(c => 
      c.id === complaint.id ? { ...c, status: "resolved", resolution: res } : c
    ));
  };

  const handleReject = async (complaint: ComplaintData) => {
    if (!complaint.id) return;
    const reason = resolutionText[complaint.id] || `Rejected by Admin.`;
    await rejectComplaint(complaint.id, reason, user!.uid, "appAdmin");
    setComplaints(prev => prev.map(c => 
      c.id === complaint.id ? { ...c, status: "rejected" } : c
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeComplaints = complaints.filter(c => c.status === "open" || c.status === "escalated" || c.status === "under_review");
  const resolvedComplaints = complaints.filter(c => c.status === "resolved" || c.status === "rejected");
  const displayList = tab === "active" ? activeComplaints : resolvedComplaints;

  return (
    <div className="space-y-8 pb-20 p-8">
      <div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">System Admin</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Final Escalations (Level 3)</h1>
        <p className="text-muted-foreground mt-1">Review critical complaints that require App Admin intervention.</p>
      </div>

      <Card className="glass-card overflow-hidden border-red-500/10">
        <CardHeader className="bg-red-500/5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Admin Escalation Queue
              {activeComplaints.length > 0 && (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">{activeComplaints.length}</Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant={tab === "active" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab("active")}
              >
                Active ({activeComplaints.length})
              </Button>
              <Button
                variant={tab === "resolved" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab("resolved")}
              >
                Resolved ({resolvedComplaints.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {displayList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No {tab} level-3 complaints found.</p>
            </div>
          ) : (
            displayList.map(complaint => (
              <div key={complaint.id} className="border border-red-500/20 bg-background/50 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{complaint.type}</Badge>
                      <Badge variant="outline" className={`text-xs ${complaint.status === "resolved" ? "text-green-500" : complaint.status === "rejected" ? "text-red-500" : "text-red-500 border-red-500/30"}`}>
                        {complaint.status}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg">{complaint.subject}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {complaint.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
                  </span>
                </div>

                <div className="bg-secondary/5 rounded-lg p-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Description:</p>
                  {complaint.description}
                </div>

                <div className="flex items-center justify-between">
                  <Dialog>
                    <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
                      <Eye className="w-4 h-4" /> View Full Trail
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Full Escalation Trail</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        {complaint.history?.map((h, i) => (
                          <div key={i} className="flex gap-3 text-sm border-l-2 border-primary/20 pl-4 py-2 relative">
                            <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-3" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold capitalize">{h.actorRole}</span>
                                <span className="text-xs text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded">{h.action}</span>
                              </div>
                              <p className="text-muted-foreground mt-1">{h.message}</p>
                              {h.timestamp && (
                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                  {new Date(h.timestamp).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {tab === "active" && (
                  <div className="pt-2 space-y-3">
                    <Textarea 
                      placeholder="Enter final resolution or rejection reason..."
                      value={resolutionText[complaint.id!] || ""}
                      onChange={e => setResolutionText({ ...resolutionText, [complaint.id!]: e.target.value })}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button className="gap-2 bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleResolve(complaint)}>
                        <CheckCircle2 className="w-4 h-4" /> Final Resolve
                      </Button>
                      <Button variant="outline" className="gap-2 flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => handleReject(complaint)}>
                        <XCircle className="w-4 h-4" /> Final Reject
                      </Button>
                    </div>
                  </div>
                )}
                
                {complaint.resolution && (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-sm text-green-700 mt-4">
                    <strong>Final Resolution:</strong> {complaint.resolution}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
