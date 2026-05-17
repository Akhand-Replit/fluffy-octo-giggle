"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, EventData } from "@/lib/services/eventService";
import { getApplicationsByEvent, ApplicationData } from "@/lib/services/applicationService";
import { submitMarking, getMarkingsByCommittee, getDailyMarkings, saveDailyMarking, Marking } from "@/lib/services/markingService";
import { getStudyGuide, saveStudyGuide, deleteStudyGuide, StudyGuide } from "@/lib/services/optionalModulesService";
import { resolveComplaint as resolveComplaintService, escalateComplaint as escalateComplaintService } from "@/lib/services/complaintService";
import { sendRoomNotification } from "@/lib/services/roomNotificationService";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db } from "@/lib/firebase/client";
import {
  collection, query, where, getDocs, doc, updateDoc, arrayUnion, serverTimestamp
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  Users, FileText, Star, Award, CheckCircle2, Search,
  MessageSquare, Loader2, Trophy, Upload, BookOpen, Trash2,
  Bell, AlertTriangle, ArrowUpCircle, XCircle, Clock, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { PositionPaperViewer } from "@/components/features/chair/PositionPaperViewer";

// ── Complaint types ───────────────────────────────────────────────────────────
interface HistoryEntry {
  action: string;
  actorUid: string;
  actorRole: string;
  message: string;
  timestamp: any;
}

interface Complaint {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: "open" | "under_review" | "escalated" | "resolved" | "rejected";
  escalationLevel: number;
  assignedTo?: string;
  assignedRole?: string;
  history: HistoryEntry[];
  resolution?: string;
  createdAt: any;
  userId: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CommitteeManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [delegates, setDelegates] = useState<ApplicationData[]>([]);
  const [markings, setMarkings] = useState<Marking[]>([]);
  const [loading, setLoading] = useState(true);
  const [committeeName, setCommitteeName] = useState("");

  // Daily Marking Matrix
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dailyMarkings, setDailyMarkings] = useState<Marking[]>([]);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Study guide
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studyGuideDialogOpen, setStudyGuideDialogOpen] = useState(false);

  // Complaints
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});
  const [complaintTab, setComplaintTab] = useState<"open" | "resolved">("open");

  // Room notifications
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "warning" | "urgent">("info");
  const [notifExpiry, setNotifExpiry] = useState(30);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSent, setNotifSent] = useState(false);
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);

  // Awards
  const [awardsDialogOpen, setAwardsDialogOpen] = useState(false);
  const [awards, setAwards] = useState({
    bestDelegate: "",
    outstandingDelegate: "",
    honorableMention: ""
  });

  // Paper Viewer
  const [selectedPaperApp, setSelectedPaperApp] = useState<ApplicationData | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user || !eventId) return;
      const [eventData, allApps] = await Promise.all([
        getEventById(eventId),
        getApplicationsByEvent(eventId)
      ]);
      if (!eventData) { router.push("/dashboard/chair"); return; }

      const myApp = allApps.find(app => app.userId === user.uid && app.status === "approved");
      const name = myApp?.assignedCommittee || myApp?.choices.primary.committee || "";
      setCommitteeName(name);

      const committeeDelegates = allApps.filter(app =>
        app.role === "Delegate" &&
        app.status === "approved" &&
        (app.assignedCommittee === name || app.choices.primary.committee === name)
      );
      const committeeMarkings = await getMarkingsByCommittee(eventId, name);

      setEvent(eventData);
      setDelegates(committeeDelegates);
      setMarkings(committeeMarkings);

      // Load study guide
      if (name) {
        const guide = await getStudyGuide(eventId, name);
        setStudyGuide(guide);
      }

      setLoading(false);

      // Load complaints assigned to this chair
      if (user.uid && name) {
        setComplaintsLoading(true);
        const q = query(
          collection(db, "complaints"),
          where("eventId", "==", eventId),
          where("assignedTo", "==", user.uid)
        );
        const snap = await getDocs(q);
        setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint)));
        setComplaintsLoading(false);
      }
    }
    loadData();
  }, [user, eventId, router]);

  useEffect(() => {
    async function loadDailyMarkings() {
      if (!eventId || !committeeName || !selectedDate) return;
      const m = await getDailyMarkings(eventId, committeeName, selectedDate);
      setDailyMarkings(m);
    }
    loadDailyMarkings();
  }, [eventId, committeeName, selectedDate]);

  // ── Marking ────────────────────────────────────────────────────────────────
  const handleScoreChange = async (delegateId: string, templateId: string, scoreStr: string, applicationId: string) => {
    const score = parseInt(scoreStr) || 0;
    
    // Optimistic update
    setDailyMarkings(prev => {
      const existing = prev.find(m => m.delegateId === delegateId);
      if (existing) {
        return prev.map(m => m.delegateId === delegateId ? { ...m, scores: { ...m.scores, [templateId]: score } } : m);
      } else {
        return [...prev, {
           eventId,
           committeeId: committeeName,
           delegateId,
           applicationId,
           dateStr: selectedDate,
           scores: { [templateId]: score },
           feedback: "",
           gradedBy: user!.uid
        }];
      }
    });

    setSavingMatrix(true);
    const existing = dailyMarkings.find(m => m.delegateId === delegateId);
    const newScores = { ...(existing?.scores || {}), [templateId]: score };
    
    await saveDailyMarking({
      eventId,
      committeeId: committeeName,
      delegateId,
      applicationId,
      dateStr: selectedDate,
      scores: newScores,
      feedback: existing?.feedback || "",
      gradedBy: user!.uid
    });
    setSavingMatrix(false);
  };

  // ── Study Guide Upload ─────────────────────────────────────────────────────
  const handleStudyGuideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are accepted."); return; }
    if (file.size > 20 * 1024 * 1024) { setUploadError("File must be under 20MB."); return; }
    setUploadError(null);
    setUploadProgress(0);

    const storageRef = ref(storage, `studyGuides/${eventId}/${committeeName}/${file.name}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on("state_changed",
      (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      (err) => { setUploadError(err.message); setUploadProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const data: StudyGuide = { url, fileName: file.name, uploadedAt: new Date(), uploadedBy: user!.uid };
        await saveStudyGuide(eventId, committeeName, data);
        setStudyGuide(data);
        setUploadProgress(null);
        setStudyGuideDialogOpen(false);
      }
    );
  };

  const handleDeleteStudyGuide = async () => {
    if (!studyGuide) return;
    try {
      const storageRef = ref(storage, `studyGuides/${eventId}/${committeeName}/${studyGuide.fileName}`);
      await deleteObject(storageRef).catch(() => {});
    } catch {}
    await deleteStudyGuide(eventId, committeeName);
    setStudyGuide(null);
  };

  // ── Complaint actions ──────────────────────────────────────────────────────
  const resolveComplaint = async (complaint: Complaint) => {
    const resolution = resolutionText[complaint.id] || "";
    await resolveComplaintService(complaint.id, resolution, user!.uid, "chair");
    
    const entry: HistoryEntry = {
      action: "resolved",
      actorUid: user!.uid,
      actorRole: "chair",
      message: resolution || "Resolved by chair.",
      timestamp: new Date().toISOString(),
    };
    
    setComplaints(prev => prev.map(c =>
      c.id === complaint.id ? { ...c, status: "resolved", resolution, history: [...(c.history || []), entry] } : c
    ));
  };

  const escalateComplaint = async (complaint: Complaint) => {
    await escalateComplaintService(complaint.id, complaint.escalationLevel, "Escalated to organizer.", user!.uid, "chair");
    
    const entry: HistoryEntry = {
      action: "escalated",
      actorUid: user!.uid,
      actorRole: "chair",
      message: "Escalated to organizer.",
      timestamp: new Date().toISOString(),
    };
    
    setComplaints(prev => prev.map(c =>
      c.id === complaint.id
        ? { ...c, status: "escalated", escalationLevel: complaint.escalationLevel + 1, history: [...(c.history || []), entry] }
        : c
    ));
  };

  // ── Room notification ──────────────────────────────────────────────────────
  const handleSendNotification = async () => {
    if (!notifMessage.trim() || !committeeName) return;
    setSendingNotif(true);
    const result = await sendRoomNotification(eventId, committeeName, {
      message: notifMessage.trim(),
      type: notifType,
      expiryMinutes: notifExpiry,
      createdBy: user!.uid,
    });
    setSendingNotif(false);
    if (result.success) {
      setNotifSent(true);
      setNotifMessage("");
      setTimeout(() => { setNotifSent(false); setNotifDialogOpen(false); }, 1500);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[600px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  const openComplaints = complaints.filter(c => c.status !== "resolved" && c.status !== "rejected");
  const resolvedComplaints = complaints.filter(c => c.status === "resolved" || c.status === "rejected");

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Chair Management Hub</Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {committeeName || "Committee"} — {event?.title}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Users className="w-4 h-4" /> {delegates.length} Approved Delegates
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Position Paper Viewer Dialog */}
          <Dialog open={!!selectedPaperApp} onOpenChange={(open) => !open && setSelectedPaperApp(null)}>
            <DialogContent className="max-w-[95vw] h-[95vh] p-0 border-0 bg-transparent shadow-none">
              <DialogTitle className="sr-only">Position Paper Viewer</DialogTitle>
              {selectedPaperApp && event && (
                <PositionPaperViewer
                  application={selectedPaperApp}
                  event={event}
                  committeeName={committeeName}
                  onClose={() => setSelectedPaperApp(null)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Study Guide */}
          <Dialog open={studyGuideDialogOpen} onOpenChange={setStudyGuideDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2"><BookOpen className="w-4 h-4" /> Study Guide</Button>} />
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> Study Guide — {committeeName}
                </DialogTitle>
                <DialogDescription>Upload a PDF study guide for your committee delegates.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {studyGuide ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-xl">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{studyGuide.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {studyGuide.uploadedAt?.toDate
                            ? formatDistanceToNow(studyGuide.uploadedAt.toDate(), { addSuffix: true })
                            : "recently"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(studyGuide.url, "_blank")}>
                        <ExternalLink className="w-4 h-4" /> View
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10"
                        onClick={handleDeleteStudyGuide}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </Button>
                    </div>
                    <Button className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4" /> Replace
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-border/50 rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-medium text-sm">Click to upload PDF</p>
                    <p className="text-xs text-muted-foreground mt-1">Max 20MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleStudyGuideUpload}
                />
                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
              </div>
            </DialogContent>
          </Dialog>

          {/* Room Notification */}
          <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2"><Bell className="w-4 h-4" /> Room Alert</Button>} />
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Send Room Notification
                </DialogTitle>
                <DialogDescription>Delegates in {committeeName} will see this immediately.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {notifSent ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold">Notification sent!</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        placeholder="e.g. All delegates please report to committee room 3."
                        className="min-h-[80px]"
                        value={notifMessage}
                        onChange={e => setNotifMessage(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={notifType} onValueChange={(v) => setNotifType(v as any)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Expires in</Label>
                        <Select value={String(notifExpiry)} onValueChange={(v) => setNotifExpiry(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!notifSent && (
                <DialogFooter>
                  <Button
                    className="w-full gap-2"
                    disabled={!notifMessage.trim() || sendingNotif}
                    onClick={handleSendNotification}
                  >
                    {sendingNotif ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Bell className="w-4 h-4" /> Send Alert</>}
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={awardsDialogOpen} onOpenChange={setAwardsDialogOpen}>
            <DialogTrigger render={<Button className="gap-2 shadow-lg shadow-primary/20"><Award className="w-4 h-4" /> Final Awards</Button>} />
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" /> Final Awards
                </DialogTitle>
                <DialogDescription>Submit the final awards for {committeeName}.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Best Delegate</Label>
                  <Select value={awards.bestDelegate} onValueChange={v => setAwards({...awards, bestDelegate: v ?? ""})}>
                    <SelectTrigger><SelectValue placeholder="Select delegate..." /></SelectTrigger>
                    <SelectContent>
                      {delegates.map(d => (
                        <SelectItem key={d.userId} value={d.userId}>{d.assignedCountry || d.applicantName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Outstanding Delegate</Label>
                  <Select value={awards.outstandingDelegate} onValueChange={v => setAwards({...awards, outstandingDelegate: v ?? ""})}>
                    <SelectTrigger><SelectValue placeholder="Select delegate..." /></SelectTrigger>
                    <SelectContent>
                      {delegates.map(d => (
                        <SelectItem key={d.userId} value={d.userId}>{d.assignedCountry || d.applicantName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Honorable Mention</Label>
                  <Select value={awards.honorableMention} onValueChange={v => setAwards({...awards, honorableMention: v ?? ""})}>
                    <SelectTrigger><SelectValue placeholder="Select delegate..." /></SelectTrigger>
                    <SelectContent>
                      {delegates.map(d => (
                        <SelectItem key={d.userId} value={d.userId}>{d.assignedCountry || d.applicantName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full gap-2" onClick={() => {
                  alert("Awards submitted successfully!");
                  setAwardsDialogOpen(false);
                }}>
                  <CheckCircle2 className="w-4 h-4" /> Submit Awards
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delegates List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-secondary/10 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Daily Marking Matrix
                    {savingMatrix && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)} 
                    className="w-auto"
                  />
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 h-9 w-48 bg-background/50" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-secondary/5 text-xs uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-4 min-w-[200px]">Delegate / Country</th>
                    {event?.markingTemplates?.map(t => (
                      <th key={t.id} className="px-4 py-4 text-center">{t.name} <span className="block text-[10px] lowercase text-muted-foreground">(/{t.maxScore})</span></th>
                    ))}
                    <th className="px-4 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {delegates.map((delegate) => {
                    const marking = dailyMarkings.find(m => m.delegateId === delegate.userId);
                    const totalScore = event?.markingTemplates?.reduce((acc, t) => acc + (marking?.scores?.[t.id] || 0), 0) || 0;
                    return (
                      <tr key={delegate.userId} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                              {delegate.assignedCountry?.[0] || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate text-sm">{delegate.assignedCountry || "Pending"}</p>
                              <p className="text-xs text-muted-foreground truncate">{delegate.applicantName}</p>
                            </div>
                          </div>
                        </td>
                        {event?.markingTemplates?.map(t => (
                           <td key={t.id} className="px-4 py-3 text-center">
                             <Input 
                               type="number" 
                               className="w-16 h-8 text-center mx-auto" 
                               min="0" 
                               max={t.maxScore}
                               value={marking?.scores?.[t.id] || ""}
                               onChange={e => handleScoreChange(delegate.userId, t.id, e.target.value, (delegate as any).id)}
                             />
                           </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                           <span className="font-bold">{totalScore}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(!event?.markingTemplates || event.markingTemplates.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                <p>No marking templates defined for this event.</p>
                <p className="text-sm">The organizer needs to configure marking templates in the event settings.</p>
              </div>
            )}
          </Card>

          {/* Complaint Inbox */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-secondary/10 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" /> Complaint Inbox
                  {openComplaints.length > 0 && (
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">{openComplaints.length}</Badge>
                  )}
                </CardTitle>
                <div className="flex gap-1">
                  {(["open", "resolved"] as const).map(tab => (
                    <Button
                      key={tab}
                      variant={complaintTab === tab ? "default" : "ghost"}
                      size="sm"
                      className="capitalize text-xs"
                      onClick={() => setComplaintTab(tab)}
                    >
                      {tab} {tab === "open" ? `(${openComplaints.length})` : `(${resolvedComplaints.length})`}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {complaintsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (complaintTab === "open" ? openComplaints : resolvedComplaints).length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm">No {complaintTab} complaints</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(complaintTab === "open" ? openComplaints : resolvedComplaints).map(complaint => (
                    <div key={complaint.id} className="border border-border/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md mr-2">
                            {complaint.type}
                          </span>
                          <h4 className="font-bold mt-1">{complaint.subject}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {complaint.createdAt?.toDate?.() instanceof Date
                            ? complaint.createdAt.toDate().toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground bg-secondary/5 rounded-lg p-3">{complaint.description}</p>

                      {complaint.status === "open" && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Resolution note (optional)"
                            value={resolutionText[complaint.id] || ""}
                            onChange={e => setResolutionText(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => resolveComplaint(complaint)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => escalateComplaint(complaint)}
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" /> Escalate to Organizer
                            </Button>
                          </div>
                        </div>
                      )}

                      {complaint.resolution && (
                        <p className="text-xs text-green-600 bg-green-500/5 border border-green-500/20 rounded-lg p-2">
                          Resolution: {complaint.resolution}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle>Committee Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Grading Progress</span>
                <span className="font-semibold">{markings.length} / {delegates.length}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(markings.length / (delegates.length || 1)) * 100}%` }}
                />
              </div>
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Top Score</span>
                  </div>
                  <span className="text-sm font-bold">
                    {markings.length > 0
                      ? Math.max(...markings.map(m => Object.values(m.scores).reduce((a, b) => a + b, 0)))
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Open Complaints</span>
                  </div>
                  <span className="text-sm font-bold">{openComplaints.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="w-4 h-4" /> Message Committee
              </Button>
              <Sheet>
                <SheetTrigger render={<Button variant="outline" className="w-full justify-start gap-2"><FileText className="w-4 h-4" /> View All Papers</Button>} />
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Position Papers — {committeeName}</SheetTitle>
                    <SheetDescription>
                      Review position papers submitted by delegates.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {delegates.map(delegate => {
                      const paperUrl = (delegate as any).positionPaperUrl;
                      return (
                        <div key={delegate.userId} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {delegate.assignedCountry?.[0] || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{delegate.assignedCountry}</p>
                              <p className="text-xs text-muted-foreground">{delegate.applicantName}</p>
                            </div>
                          </div>
                          {paperUrl ? (
                            <Button size="sm" variant="outline" className="gap-2" onClick={() => setSelectedPaperApp(delegate)}>
                              <ExternalLink className="w-3.5 h-3.5" /> Grade
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Not submitted</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setNotifDialogOpen(true)}
              >
                <Bell className="w-4 h-4" /> Send Room Alert
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setStudyGuideDialogOpen(true)}
              >
                <BookOpen className="w-4 h-4" /> {studyGuide ? "Manage" : "Upload"} Study Guide
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
