"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, EventData } from "@/lib/services/eventService";
import { getApplicationsByEvent, ApplicationData } from "@/lib/services/applicationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Settings, Globe2, Clock, CheckCircle2,
  Mail, CalendarDays, ExternalLink, Activity, Target, MessageSquare, ArrowRight, BookOpen, Award, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function OrganizerEventOverviewPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

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
      setApplications(apps);
      setLoading(false);
    }
    loadData();
  }, [user, eventId, router]);

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
    capacityLimit: event.committees?.reduce((acc, c) => acc + (c.capacity || 0), 0) || 0,
  };

  const capacityPercent = stats.capacityLimit > 0 ? Math.round((stats.approved / stats.capacityLimit) * 100) : 0;
  const daysUntilEvent = Math.max(0, Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const nextSession = event.schedule?.filter(s => new Date(s.startTime).getTime() > new Date().getTime()).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const pendingAssignments = applications.filter(a => a.status === "approved" && !a.assignedCountry).length;

  return (
    <div className="space-y-8 pb-20">
      {/* Event Header Card */}
      <Card className="glass-card overflow-hidden border-border/40 relative">
        {event.coverUrl && (
          <div className="h-32 w-full object-cover opacity-20 absolute top-0 left-0" style={{ backgroundImage: `url(${event.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={event.status === "published" ? "default" : "secondary"}>
                  {event.status === "published" ? "Live" : "Draft"}
                </Badge>
                {event.lastEditedAt && (
                   <span className="text-xs text-muted-foreground">
                     Last edited {formatDistanceToNow(typeof event.lastEditedAt === 'string' ? new Date(event.lastEditedAt) : event.lastEditedAt.toDate?.() || new Date())} ago
                   </span>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{event.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> {event.date} &bull; {event.location}
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button onClick={() => router.push(`/dashboard/organizer/events/create?edit=${eventId}`)} className="gap-2">
                <Settings className="w-4 h-4" /> Edit Event
              </Button>
              <Button variant="outline" className="gap-2" render={<Link href={`/events/${eventId}`} target="_blank" />} nativeButton={false}>
                <ExternalLink className="w-4 h-4" /> View Public Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <Users className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Applicants</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Approved</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <Activity className="w-6 h-6 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{capacityPercent}%</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Capacity</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <CalendarDays className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{daysUntilEvent}</p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Days Away</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest delegates and staff</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground" onClick={() => router.push(`/dashboard/organizer/events/${eventId}/applications`)}>
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/5 border border-border/40 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {app.role[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{app.name || "New Applicant"}</p>
                        <p className="text-xs text-muted-foreground">{app.choices?.primary?.committee || app.role}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{app.status}</Badge>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">No applications yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Pending Assignments */}
             <Card className="glass-card flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe2 className="w-5 h-5 text-blue-500" /> Country Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <p className="text-3xl font-bold mb-1">{pendingAssignments}</p>
                  <p className="text-sm text-muted-foreground mb-4">Pending assignments</p>
                </div>
                <Button className="w-full gap-2 mt-auto" variant={pendingAssignments > 0 ? "default" : "secondary"} onClick={() => router.push(`/dashboard/organizer/events/${eventId}/countries`)}>
                  Assign Now <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Next Schedule Item */}
            <Card className="glass-card flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-orange-500" /> Upcoming Session
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  {nextSession ? (
                    <>
                      <p className="font-semibold mb-1 truncate">{nextSession.title}</p>
                      <p className="text-sm text-muted-foreground mb-4">{new Date(nextSession.startTime).toLocaleString()} - {nextSession.location}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold mb-1">No upcoming sessions</p>
                      <p className="text-sm text-muted-foreground mb-4">Within 7 days</p>
                    </>
                  )}
                </div>
                <Button className="w-full gap-2 mt-auto" variant="outline" onClick={() => router.push(`/dashboard/organizer/events/${eventId}/schedule`)}>
                  View Full Schedule <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Committees</CardTitle>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => router.push(`/dashboard/organizer/events/${eventId}/committees`)}>
                Manage
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.committees?.map((committee: any, i: number) => {
                const count = applications.filter(a => a.assignedCommittee === committee.name || a.choices?.primary?.committee === committee.name).length;
                const progress = Math.min((count / (committee.capacity || 100)) * 100, 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="truncate max-w-[120px]">{committee.name}</span>
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

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle>Quick Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/dashboard/organizer/events/${eventId}/complaints`} className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 border border-border/40 transition-colors text-center group">
                  <Badge className="mb-2 bg-primary/10 text-primary group-hover:bg-primary/20"><AlertTriangle className="w-4 h-4" /></Badge>
                  <span className="text-xs font-medium">Complaints</span>
                </Link>
                <Link href={`/dashboard/organizer/events/${eventId}/tools/id-cards`} className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 border border-border/40 transition-colors text-center group">
                  <Badge className="mb-2 bg-primary/10 text-primary group-hover:bg-primary/20"><Users className="w-4 h-4" /></Badge>
                  <span className="text-xs font-medium">ID Cards</span>
                </Link>
                <Link href={`/dashboard/organizer/events/${eventId}/tools/certificates`} className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 border border-border/40 transition-colors text-center group">
                  <Badge className="mb-2 bg-primary/10 text-primary group-hover:bg-primary/20"><Award className="w-4 h-4" /></Badge>
                  <span className="text-xs font-medium">Certificates</span>
                </Link>
                <Link href={`/dashboard/organizer/events/${eventId}/announcements`} className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 border border-border/40 transition-colors text-center group">
                  <Badge className="mb-2 bg-primary/10 text-primary group-hover:bg-primary/20"><Mail className="w-4 h-4" /></Badge>
                  <span className="text-xs font-medium">Announcements</span>
                </Link>
                <Link href={`/dashboard/organizer/events/${eventId}/partners`} className="flex flex-col items-center justify-center p-3 rounded-xl bg-secondary/5 hover:bg-secondary/10 border border-border/40 transition-colors text-center group">
                  <Badge className="mb-2 bg-primary/10 text-primary group-hover:bg-primary/20"><Target className="w-4 h-4" /></Badge>
                  <span className="text-xs font-medium">Partners</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
