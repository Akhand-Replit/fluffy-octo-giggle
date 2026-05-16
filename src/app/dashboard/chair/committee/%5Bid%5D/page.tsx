"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, EventData } from "@/lib/services/eventService";
import { getApplicationsByEvent, ApplicationData } from "@/lib/services/applicationService";
import { submitMarking, getMarkingsByCommittee, Marking } from "@/lib/services/markingService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  FileText, 
  Star, 
  Award, 
  CheckCircle2, 
  Search,
  MessageSquare,
  ChevronRight,
  Loader2,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function CommitteeManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [delegates, setDelegates] = useState<ApplicationData[]>([]);
  const [markings, setMarkings] = useState<Marking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelegate, setSelectedDelegate] = useState<ApplicationData | null>(null);
  const [markingForm, setMarkingForm] = useState({
    debate: 0,
    positionPaper: 0,
    diplomacy: 0,
    feedback: ""
  });
  const [submittingMarking, setSubmittingMarking] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user || !eventId) return;

      const [eventData, allApps] = await Promise.all([
        getEventById(eventId),
        getApplicationsByEvent(eventId)
      ]);

      if (!eventData) {
        router.push("/dashboard/chair");
        return;
      }

      // Find the user's role in this event to determine their committee
      const myApp = allApps.find(app => app.userId === user.uid && app.status === "approved");
      if (!myApp || !myApp.role.toLowerCase().includes("chair") && !myApp.role.toLowerCase().includes("director")) {
        // Not a chair for this event
        // router.push("/dashboard/chair");
        // return;
      }

      const committeeName = myApp?.assignedCommittee || myApp?.choices.primary.committee;
      
      const committeeDelegates = allApps.filter(app => 
        app.role === "Delegate" && 
        app.status === "approved" && 
        (app.assignedCommittee === committeeName || app.choices.primary.committee === committeeName)
      );

      const committeeMarkings = await getMarkingsByCommittee(eventId, committeeName || "");

      setEvent(eventData);
      setDelegates(committeeDelegates);
      setMarkings(committeeMarkings);
      setLoading(false);
    }

    loadData();
  }, [user, eventId, router]);

  const handleMarkingSubmit = async () => {
    if (!selectedDelegate || !user) return;
    setSubmittingMarking(true);

    const total = markingForm.debate + markingForm.positionPaper + markingForm.diplomacy;
    
    const markingData: Omit<Marking, "id"> = {
      eventId,
      committeeId: selectedDelegate.assignedCommittee || selectedDelegate.choices.primary.committee,
      delegateId: selectedDelegate.userId,
      applicationId: (selectedDelegate as any).id,
      scores: {
        ...markingForm,
        total
      },
      feedback: markingForm.feedback,
      gradedBy: user.uid
    };

    const result = await submitMarking(markingData);
    if (result.success) {
      const newMarking = { id: result.id, ...markingData } as Marking;
      setMarkings(prev => [newMarking, ...prev.filter(m => m.delegateId !== selectedDelegate.userId)]);
      setSelectedDelegate(null);
      setMarkingForm({ debate: 0, positionPaper: 0, diplomacy: 0, feedback: "" });
    }
    setSubmittingMarking(false);
  };

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

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2">Chair Management Hub</Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            {delegates[0]?.assignedCommittee || "Committee"} - {event?.title}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Users className="w-4 h-4" /> {delegates.length} Approved Delegates
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> Study Guide
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Award className="w-4 h-4" /> Final Awards
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Delegates List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-secondary/10 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Delegate Roster</CardTitle>
                  <CardDescription>View and evaluate delegate performance.</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-9 h-9 w-48 bg-background/50" />
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-secondary/5 text-xs uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4">Delegate / Country</th>
                    <th className="px-6 py-4">Position Paper</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {delegates.map((delegate) => {
                    const marking = markings.find(m => m.delegateId === delegate.userId);
                    return (
                      <tr key={delegate.userId} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {delegate.assignedCountry?.[0] || "?"}
                            </div>
                            <div>
                              <p className="font-medium">{delegate.assignedCountry || "Pending"}</p>
                              <p className="text-xs text-muted-foreground">ID: {delegate.userId.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="gap-1.5 py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Submitted
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {marking ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">{marking.scores.total}</span>
                              <span className="text-xs text-muted-foreground">/ 100</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not Graded</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Dialog>
                            <DialogTrigger render={
                              <Button 
                                variant={marking ? "outline" : "default"} 
                                size="sm" 
                                className="gap-2"
                                onClick={() => {
                                  setSelectedDelegate(delegate);
                                  if (marking) {
                                    setMarkingForm({
                                      debate: marking.scores.debate,
                                      positionPaper: marking.scores.positionPaper,
                                      diplomacy: marking.scores.diplomacy,
                                      feedback: marking.feedback
                                    });
                                  }
                                }}
                            />
                          }>
                            <Star className="w-4 h-4" />
                            {marking ? "Update Grade" : "Evaluate"}
                          </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Trophy className="w-5 h-5 text-yellow-500" />
                                  Evaluate Delegate: {delegate.assignedCountry}
                                </DialogTitle>
                                <DialogDescription>
                                  Score delegate performance across key MUN criteria.
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Debate Performance (0-40)</Label>
                                    <Input 
                                      type="number" 
                                      max="40" 
                                      value={markingForm.debate}
                                      onChange={(e) => setMarkingForm({...markingForm, debate: parseInt(e.target.value) || 0})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Position Paper (0-30)</Label>
                                    <Input 
                                      type="number" 
                                      max="30" 
                                      value={markingForm.positionPaper}
                                      onChange={(e) => setMarkingForm({...markingForm, positionPaper: parseInt(e.target.value) || 0})}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Diplomacy & Lobbying (0-30)</Label>
                                  <Input 
                                    type="number" 
                                    max="30" 
                                    value={markingForm.diplomacy}
                                    onChange={(e) => setMarkingForm({...markingForm, diplomacy: parseInt(e.target.value) || 0})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Feedback & Comments</Label>
                                  <Textarea 
                                    placeholder="Provide constructive feedback..."
                                    className="min-h-[100px]"
                                    value={markingForm.feedback}
                                    onChange={(e) => setMarkingForm({...markingForm, feedback: e.target.value})}
                                  />
                                </div>
                                <div className="p-4 bg-secondary/30 rounded-xl flex items-center justify-between">
                                  <span className="font-semibold">Total Score</span>
                                  <span className="text-2xl font-bold text-primary">
                                    {markingForm.debate + markingForm.positionPaper + markingForm.diplomacy} / 100
                                  </span>
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button className="w-full" onClick={handleMarkingSubmit} disabled={submittingMarking}>
                                  {submittingMarking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  Submit Evaluation
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Committee Stats</CardTitle>
            </CardHeader>
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
                    <span className="text-sm font-medium">Top Delegate</span>
                  </div>
                  <span className="text-sm font-bold">
                    {markings.length > 0 ? markings.sort((a, b) => b.scores.total - a.scores.total)[0].scores.total : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageSquare className="w-4 h-4" /> Message Committee
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" /> View All Papers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
