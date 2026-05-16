"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, updateEvent, EventData, ScheduleItem } from "@/lib/services/eventService";
import { getApplicationsByEvent, updateApplication, ApplicationData } from "@/lib/services/applicationService";
import { logActivity } from "@/lib/services/activityService";
import { suggestCountryAssignments, applyAIAssignments, AssignmentSuggestion } from "@/lib/services/aiAssignmentService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, Settings, Globe2, TrendingUp, Clock, CheckCircle2, XCircle,
  MoreVertical, Mail, Filter, Download, CalendarDays, Plus, Trash2, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const SCHEDULE_TYPES = ["main", "session", "break", "social"] as const;

export default function OrganizerEventManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user, profile } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Schedule state
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Country assignment state
  const [selectedCommittee, setSelectedCommittee] = useState<string>("");
  const [aiSuggestions, setAiSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [runningAi, setRunningAi] = useState(false);
  const [applyingAi, setApplyingAi] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user || !eventId) return;
      const [eventData, apps] = await Promise.all([
        getEventById(eventId),
        getApplicationsByEvent(eventId),
      ]);
      if (!eventData || eventData.organizerId !== user.uid) {
        router.push("/dashboard/organizer/events");
        return;
      }
      setEvent(eventData);
      setSchedule(eventData.schedule || []);
      setApplications(apps);
      if (eventData.committees?.length > 0) {
        setSelectedCommittee(eventData.committees[0].name);
      }
      setLoading(false);
    }
    loadData();
  }, [user, eventId, router]);

  const handleStatusChange = async (appId: string, status: "approved" | "rejected" | "pending") => {
    const { success } = await updateApplication(appId, { status });
    if (success) {
      const app = applications.find(a => (a as any).id === appId);
      setApplications(prev =>
        prev.map(a => (a as any).id === appId ? { ...a, status } : a)
      );
      if (status === "approved" || status === "rejected") {
        logActivity({
          userId: user!.uid,
          actorName: profile?.displayName || "Organizer",
          actorRole: "Organizer",
          type: status === "approved" ? "application_approved" : "application_rejected",
          action: status === "approved" ? "approved an application for" : "rejected an application for",
          targetId: eventId,
          targetTitle: event?.title || "",
          isPublic: false,
        });
      }
    }
  };

  const handleCountryAssign = async (appId: string, country: string) => {
    await updateApplication(appId, { assignedCountry: country });
    setApplications(prev =>
      prev.map(a => (a as any).id === appId ? { ...a, assignedCountry: country } : a)
    );
  };

  const handleRunAI = async () => {
    if (!event || !selectedCommittee) return;
    setRunningAi(true);
    const committee = event.committees.find(c => c.name === selectedCommittee);
    if (!committee) { setRunningAi(false); return; }
    const committeeApps = applications.filter(
      a => a.status === "approved" && (a.assignedCommittee === committee.name || a.choices.primary.committee === committee.name)
    );
    const suggestions = await suggestCountryAssignments(committeeApps as any, committee);
    setAiSuggestions(suggestions);
    setRunningAi(false);
    setShowAiDialog(true);
  };

  const handleApplyAI = async () => {
    setApplyingAi(true);
    await applyAIAssignments(aiSuggestions);
    const refreshed = await getApplicationsByEvent(eventId);
    setApplications(refreshed);
    setApplyingAi(false);
    setShowAiDialog(false);
  };

  const addScheduleItem = () => {
    setSchedule(prev => [...prev, { title: "", startTime: "", endTime: "", type: "session", location: "", description: "" }]);
  };

  const updateScheduleItem = (idx: number, field: keyof ScheduleItem, value: string) => {
    setSchedule(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeScheduleItem = (idx: number) => {
    setSchedule(prev => prev.filter((_, i) => i !== idx));
  };

  const saveSchedule = async () => {
    if (!event) return;
    setSavingSchedule(true);
    await updateEvent(eventId, { schedule });
    setEvent(prev => prev ? { ...prev, schedule } : prev);
    setSavingSchedule(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  if (!event) return null;

  const stats = {
    total: applications.length,
    approved: applications.filter(a => a.status === "approved").length,
    pending: applications.filter(a => a.status === "pending").length,
    revenue: applications.filter(a => a.status === "approved").length * 50,
  };

  const committeeApps = applications.filter(
    a => a.status === "approved" &&
      (a.assignedCommittee === selectedCommittee || a.choices.primary.committee === selectedCommittee)
  );

  const selectedCommitteeData = event.committees.find(c => c.name === selectedCommittee);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Organizer Portal</Badge>
            <Badge variant={event.status === "published" ? "default" : "secondary"}>
              {event.status === "published" ? "Live" : "Draft"}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {event.date} &bull; {event.location}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" /> Edit Event
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Mail className="w-4 h-4" /> Broadcast Email
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Applicants", value: stats.total, color: "blue", Icon: Users },
          { label: "Approved", value: stats.approved, color: "green", Icon: CheckCircle2 },
          { label: "Pending", value: stats.pending, color: "yellow", Icon: Clock },
          { label: "Est. Revenue", value: `$${stats.revenue}`, color: "primary", Icon: TrendingUp },
        ].map(({ label, value, color, Icon }) => (
          <Card key={label} className="glass-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${color === "green" ? "text-green-500" : color === "yellow" ? "text-yellow-500" : color === "blue" ? "" : "text-primary"}`}>{value}</p>
                </div>
                <div className={`w-12 h-12 bg-${color === "primary" ? "primary" : color + "-500"}/10 rounded-2xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${color === "primary" ? "primary" : color + "-500"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-background/50 backdrop-blur-md border border-border/50 p-1 rounded-2xl h-auto mb-8 flex-wrap">
          {["overview", "applications", "assignments", "schedule"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="rounded-xl py-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* OVERVIEW */}
            <TabsContent value="overview" className="mt-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>Latest applications from delegates.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {applications.slice(0, 5).map((app, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/5 border border-border/40">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {app.role[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">New {app.role} Application</p>
                              <p className="text-xs text-muted-foreground">{app.choices.primary.committee} &bull; {app.choices.primary.country}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{app.status}</Badge>
                        </div>
                      ))}
                      {applications.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-sm">No applications yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Committee Capacity</CardTitle>
                    <CardDescription>Delegate distribution per committee.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.committees.map((committee, i) => {
                      const count = applications.filter(a =>
                        a.assignedCommittee === committee.name || a.choices.primary.committee === committee.name
                      ).length;
                      const progress = Math.min((count / (committee.capacity || 100)) * 100, 100);
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{committee.name}</span>
                            <span>{count} / {committee.capacity || 100}</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* APPLICATIONS */}
            <TabsContent value="applications" className="mt-0 outline-none">
              <Card className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-secondary/5 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-3.5 h-3.5" /> Filter
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-secondary/10 text-xs uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/50">
                      <tr>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Committee (1st Choice)</th>
                        <th className="px-6 py-4">Country (1st Choice)</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {applications.map(app => (
                        <tr key={(app as any).id} className="hover:bg-secondary/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                {app.role[0]}
                              </div>
                              <span className="font-medium text-sm">{app.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">{app.choices.primary.committee}</td>
                          <td className="px-6 py-4 text-sm">{app.choices.primary.country}</td>
                          <td className="px-6 py-4">
                            <Badge variant={app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                              {app.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                                <MoreVertical className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Manage Application</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-green-500 focus:text-green-500" onClick={() => handleStatusChange((app as any).id, "approved")}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleStatusChange((app as any).id, "rejected")}>
                                  <XCircle className="w-4 h-4 mr-2" /> Reject
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange((app as any).id, "pending")}>
                                  <Clock className="w-4 h-4 mr-2" /> Move to Pending
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {applications.length === 0 && (
                    <div className="py-16 text-center text-muted-foreground text-sm">No applications yet.</div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* COUNTRY ASSIGNMENTS */}
            <TabsContent value="assignments" className="mt-0 outline-none">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Country Assignments</CardTitle>
                    <CardDescription>Assign countries to approved delegates per committee.</CardDescription>
                  </div>
                  <Button onClick={handleRunAI} disabled={runningAi} className="gap-2 shrink-0">
                    {runningAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe2 className="w-4 h-4" />}
                    Run AI Suggestion
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Committee selector */}
                  <div className="flex flex-wrap gap-2">
                    {event.committees.map(c => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedCommittee(c.name)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                          selectedCommittee === c.name
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  {/* Approved delegates table */}
                  {committeeApps.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-xl text-muted-foreground text-sm">
                      No approved delegates in {selectedCommittee} yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border/40">
                      <table className="w-full text-left">
                        <thead className="bg-secondary/10 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">1st Country Choice</th>
                            <th className="px-5 py-3">Assigned Country</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {committeeApps.map(app => (
                            <tr key={(app as any).id} className="hover:bg-secondary/5">
                              <td className="px-5 py-3 text-sm font-medium">{app.role}</td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{app.choices.primary.country || "—"}</td>
                              <td className="px-5 py-3">
                                <Select
                                  value={app.assignedCountry || ""}
                                  onValueChange={val => handleCountryAssign((app as any).id, val as string)}
                                >
                                  <SelectTrigger className="w-48 h-8 text-sm">
                                    <SelectValue placeholder="Assign country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedCommitteeData?.countries.map(country => (
                                      <SelectItem key={country} value={country}>{country}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Suggestions Dialog */}
              <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>AI Country Suggestions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border/40 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs text-muted-foreground uppercase">Application</span>
                          <Badge variant="secondary">{s.suggestedCountry}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.reason}</p>
                      </div>
                    ))}
                    {aiSuggestions.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">No suggestions generated.</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAiDialog(false)}>Cancel</Button>
                    <Button onClick={handleApplyAI} disabled={applyingAi || aiSuggestions.length === 0}>
                      {applyingAi ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Apply All
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* SCHEDULE */}
            <TabsContent value="schedule" className="mt-0 outline-none">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Conference Schedule</CardTitle>
                    <CardDescription>Build the event timeline visible to delegates.</CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" onClick={addScheduleItem} className="gap-2">
                      <Plus className="w-4 h-4" /> Add Item
                    </Button>
                    <Button onClick={saveSchedule} disabled={savingSchedule} className="gap-2">
                      {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                      Save Schedule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {schedule.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-xl">
                      <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No schedule items yet. Click "Add Item" to start.</p>
                    </div>
                  ) : (
                    schedule.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-border/40 bg-secondary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Item {idx + 1}</span>
                          <button onClick={() => removeScheduleItem(idx)} className="text-destructive hover:text-destructive/80 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={item.title}
                              onChange={e => updateScheduleItem(idx, "title", e.target.value)}
                              placeholder="e.g., Opening Ceremony"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Type</Label>
                            <Select value={item.type} onValueChange={val => updateScheduleItem(idx, "type", val as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SCHEDULE_TYPES.map(t => (
                                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Start Time</Label>
                            <Input
                              value={item.startTime}
                              onChange={e => updateScheduleItem(idx, "startTime", e.target.value)}
                              placeholder="e.g., 09:00 AM"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">End Time</Label>
                            <Input
                              value={item.endTime}
                              onChange={e => updateScheduleItem(idx, "endTime", e.target.value)}
                              placeholder="e.g., 10:30 AM"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Location</Label>
                            <Input
                              value={item.location}
                              onChange={e => updateScheduleItem(idx, "location", e.target.value)}
                              placeholder="e.g., Main Hall"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Description (optional)</Label>
                            <Input
                              value={item.description || ""}
                              onChange={e => updateScheduleItem(idx, "description", e.target.value)}
                              placeholder="Brief description..."
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
