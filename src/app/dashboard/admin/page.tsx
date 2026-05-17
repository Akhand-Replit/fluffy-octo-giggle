"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, getDoc, query, where, doc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getAllUsers, updateUserRole, UserProfile } from "@/lib/services/userService";
import { getAllEvents, EventData } from "@/lib/services/eventService";
import { getRecentActivities, ActivityData } from "@/lib/services/activityService";
import { logAudit } from "@/lib/services/auditService";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, Calendar, ShieldAlert, TrendingUp, MoreVertical,
  Settings, Activity, Globe2, Trash2, UserCog, Loader2, CheckCircle, XCircle
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const ROLES = ["delegate", "Organizer", "Chair", "App Admin"];

export default function AppAdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ users: 0, events: 0, applications: 0, revenue: 0 });
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [organizerApps, setOrganizerApps] = useState<any[]>([]);
  const [proApps, setProApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);

  // Role change dialog
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: UserProfile | null; newRole: string }>({
    open: false, user: null, newRole: "",
  });
  const [savingRole, setSavingRole] = useState(false);

  // Delete event dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; eventId: string; title: string }>({
    open: false, eventId: "", title: "",
  });
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Extend Pro dialog
  const [extendProDialog, setExtendProDialog] = useState<{ open: boolean; uid: string; email: string; months: string }>({
    open: false, uid: "", email: "", months: "1"
  });
  const [extendingPro, setExtendingPro] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersSnap, appsSnap, recentActs] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "applications")),
          getRecentActivities(5),
        ]);
        const publishedEventsSnap = await getDocs(
          query(collection(db, "events"), where("status", "==", "published"))
        );
        setStats({
          users: usersSnap.size,
          events: publishedEventsSnap.size,
          applications: appsSnap.size,
          revenue: appsSnap.docs.filter((d: any) => d.data().status === "approved").length * 50,
        });
        setActivities(recentActs);
      } catch (error) {
        console.error("Error fetching global stats:", error);
      } finally {
        setLoading(false);
      }
    }
    if (profile?.role === "App Admin" || (profile as any)?.isAdmin) fetchStats();
  }, [profile]);

  async function loadUsers() {
    if (users.length > 0) return;
    setUsersLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setUsersLoading(false);
  }

  async function loadEvents() {
    if (events.length > 0) return;
    setEventsLoading(true);
    const data = await getAllEvents();
    setEvents(data);
    setEventsLoading(false);
  }

  async function loadOrganizerApps() {
    if (organizerApps.length > 0 && proApps.length > 0) return;
    setAppsLoading(true);
    try {
      const [orgSnap, proSnap] = await Promise.all([
        getDocs(query(collection(db, "organizerApplications"), where("status", "==", "pending"))),
        getDocs(query(collection(db, "proApplications"), where("status", "==", "pending")))
      ]);
      setOrganizerApps(orgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProApps(proSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error loading apps:", error);
    } finally {
      setAppsLoading(false);
    }
  }

  async function handleApproveOrganizer(appId: string, uid: string) {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        role: "Organizer",
        organizerApplicationStatus: "approved"
      });
      batch.update(doc(db, "organizerApplications", appId), {
        status: "approved"
      });
      await batch.commit();
      
      await logAudit({
        actorUid: profile?.uid || "",
        actorEmail: profile?.email || "",
        actorRole: profile?.role || "",
        action: "organizer_approved",
        targetType: "user",
        targetId: uid,
        targetName: "Organizer Application",
      });

      setOrganizerApps(prev => prev.filter(app => app.id !== appId));
    } catch (error) {
      console.error("Error approving organizer:", error);
    }
  }

  async function handleRejectOrganizer(appId: string, uid: string) {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        organizerApplicationStatus: "rejected"
      });
      batch.update(doc(db, "organizerApplications", appId), {
        status: "rejected"
      });
      await batch.commit();

      await logAudit({
        actorUid: profile?.uid || "",
        actorEmail: profile?.email || "",
        actorRole: profile?.role || "",
        action: "organizer_rejected",
        targetType: "user",
        targetId: uid,
        targetName: "Organizer Application",
      });

      setOrganizerApps(prev => prev.filter(app => app.id !== appId));
    } catch (error) {
      console.error("Error rejecting organizer:", error);
    }
  }

  async function handleApprovePro(appId: string, uid: string) {
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      const currentExpiry = userDoc.data()?.proExpiresAt?.toDate?.() || new Date();
      const newExpiry = new Date(Math.max(Date.now(), currentExpiry.getTime()));
      newExpiry.setMonth(newExpiry.getMonth() + 1); // standard 1 month

      batch.update(userRef, {
        proStatus: "active",
        proActivatedAt: new Date(),
        proExpiresAt: newExpiry
      });
      batch.update(doc(db, "proApplications", appId), {
        status: "approved"
      });
      await batch.commit();

      await logAudit({
        actorUid: profile?.uid || "",
        actorEmail: profile?.email || "",
        actorRole: profile?.role || "",
        action: "pro_approved",
        targetType: "user",
        targetId: uid,
        targetName: "Pro Application",
      });

      setProApps(prev => prev.filter(app => app.id !== appId));
    } catch (error) {
      console.error("Error approving pro:", error);
    }
  }

  async function handleRejectPro(appId: string, uid: string) {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), { proStatus: "rejected" });
      batch.update(doc(db, "proApplications", appId), { status: "rejected" });
      await batch.commit();

      await logAudit({
        actorUid: profile?.uid || "",
        actorEmail: profile?.email || "",
        actorRole: profile?.role || "",
        action: "pro_rejected",
        targetType: "user",
        targetId: uid,
        targetName: "Pro Application",
      });

      setProApps(prev => prev.filter(app => app.id !== appId));
    } catch (error) {
      console.error("Error rejecting pro:", error);
    }
  }

  async function applyProExtension() {
    if (!extendProDialog.uid) return;
    setExtendingPro(true);
    
    try {
      const userRef = doc(db, "users", extendProDialog.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentExpiry = userDoc.data().proExpiresAt?.toDate?.() || new Date();
        const newExpiry = new Date(Math.max(Date.now(), currentExpiry.getTime()));
        newExpiry.setMonth(newExpiry.getMonth() + parseInt(extendProDialog.months));
        
        await updateDoc(userRef, {
          proStatus: "active",
          proExpiresAt: newExpiry
        });
        
        await logAudit({
          actorUid: profile?.uid || "",
          actorEmail: profile?.email || "",
          actorRole: profile?.role || "",
          action: "pro_extended_manual",
          targetType: "user",
          targetId: extendProDialog.uid,
          targetName: extendProDialog.email,
        });
      }
    } catch (error) {
      console.error("Error extending pro:", error);
    }

    setExtendingPro(false);
    setExtendProDialog({ open: false, uid: "", email: "", months: "1" });
  }

  async function applyRoleChange() {
    if (!roleDialog.user || !roleDialog.newRole) return;
    setSavingRole(true);
    await updateUserRole(roleDialog.user.uid, roleDialog.newRole);
    
    await logAudit({
      actorUid: profile?.uid || "",
      actorEmail: profile?.email || "",
      actorRole: profile?.role || "",
      action: "role_changed",
      targetType: "user",
      targetId: roleDialog.user.uid,
      targetName: roleDialog.user.email,
      after: JSON.stringify({ role: roleDialog.newRole }),
    });

    setUsers(prev => prev.map(u => u.uid === roleDialog.user!.uid ? { ...u, role: roleDialog.newRole } : u));
    setSavingRole(false);
    setRoleDialog({ open: false, user: null, newRole: "" });
  }

  async function confirmDeleteEvent() {
    if (!deleteDialog.eventId) return;
    setDeletingEvent(true);
    await deleteDoc(doc(db, "events", deleteDialog.eventId));
    
    await logAudit({
      actorUid: profile?.uid || "",
      actorEmail: profile?.email || "",
      actorRole: profile?.role || "",
      action: "event_deleted",
      targetType: "event",
      targetId: deleteDialog.eventId,
      targetName: deleteDialog.title,
    });

    setEvents(prev => prev.filter(e => e.id !== deleteDialog.eventId));
    setDeletingEvent(false);
    setDeleteDialog({ open: false, eventId: "", title: "" });
  }

  async function toggleEventStatus(eventId: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    await updateDoc(doc(db, "events", eventId), { status: newStatus });
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus as any } : e));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10 mb-1">System Administrator</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Global Oversight</h1>
          <p className="text-muted-foreground mt-1">Monitor platform activity, manage events and users.</p>
        </div>
        <div className="flex gap-3">
          <Button render={<Link href="/dashboard/admin/settings"/>} nativeButton={false} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" /> System Settings
          </Button>
          <Button render={<Link href="/dashboard/admin/audit-logs"/>} nativeButton={false} className="gap-2">
            <ShieldAlert className="w-4 h-4" /> Audit Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: stats.users, color: "blue", Icon: Users },
          { label: "Live Events", value: stats.events, color: "purple", Icon: Calendar },
          { label: "Applications", value: stats.applications, color: "yellow", Icon: Globe2 },
          { label: "Global Revenue", value: `$${stats.revenue}`, color: "green", Icon: TrendingUp },
        ].map(({ label, value, color, Icon }) => (
          <Card key={label} className={`glass-card border-l-4 border-l-${color}-500`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 bg-${color}-500/10 rounded-2xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${color}-500`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="bg-background/50 backdrop-blur-md border border-border/50 p-1 rounded-2xl h-auto mb-6">
          <TabsTrigger value="activity" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
            <Activity className="w-4 h-4" /> Activity
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2" onClick={loadEvents}>
            <Calendar className="w-4 h-4" /> Events
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2" onClick={loadUsers}>
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="organizer-apps" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2" onClick={loadOrganizerApps}>
            <ShieldAlert className="w-4 h-4" /> Organizer Applications
          </TabsTrigger>
        </TabsList>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="glass-card lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Recent Activity Feed</CardTitle>
                  <CardDescription>Real-time updates from across the platform.</CardDescription>
                </div>
                <Activity className="w-5 h-5 text-muted-foreground animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">No recent activity. Activities appear as users interact with the platform.</p>
                  ) : activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/5 border border-border/40">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {act.actorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          <span className="text-primary">{act.actorName}</span> {act.action} <span className="font-semibold">{act.targetTitle}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {act.actorRole} &bull; {act.createdAt ? formatDistanceToNow(act.createdAt.toDate(), { addSuffix: true }) : "just now"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader><CardTitle>Quick Access</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between">
                    <span className="text-sm font-medium">Flagged Comments</span>
                    <Badge variant="destructive">0</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Approvals</span>
                    <Badge variant="outline">{stats.applications}</Badge>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between">
                    <span className="text-sm font-medium">System Health</span>
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/10">Optimal</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card bg-primary text-primary-foreground overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                <CardHeader>
                  <CardTitle>Admin Support</CardTitle>
                  <CardDescription className="text-primary-foreground/70">Contact dev team for technical issues.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full">Open Support Ticket</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* EVENTS MANAGEMENT */}
        <TabsContent value="events" className="mt-0">
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>All Events</CardTitle>
              <CardDescription>Manage all conferences across the platform.</CardDescription>
            </CardHeader>
            {eventsLoading ? (
              <CardContent><Skeleton className="h-48 w-full rounded-xl" /></CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/10 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Organizer ID</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {events.map(event => (
                      <tr key={event.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-sm">{event.title}</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono">{event.organizerId?.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm">{event.date}</td>
                        <td className="px-6 py-4">
                          <Badge variant={event.status === "published" ? "default" : "secondary"} className="capitalize">
                            {event.status || "draft"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Manage Event</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleEventStatus(event.id, event.status || "draft")}>
                                {event.status === "published" ? "Move to Draft" : "Publish"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteDialog({ open: true, eventId: event.id, title: event.title })}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground text-sm">No events found.</div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* USERS MANAGEMENT */}
        <TabsContent value="users" className="mt-0">
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage roles across the platform.</CardDescription>
            </CardHeader>
            {usersLoading ? (
              <CardContent><Skeleton className="h-48 w-full rounded-xl" /></CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/10 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{u.displayName || "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="capitalize">{u.role}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() => setRoleDialog({ open: true, user: u, newRole: u.role })}
                          >
                            <UserCog className="w-3.5 h-3.5" /> Change Role
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => setExtendProDialog({ open: true, uid: u.uid, email: u.email, months: "1" })}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" /> Extend Pro
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground text-sm">No users found.</div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ORGANIZER APPLICATIONS MANAGEMENT */}
        <TabsContent value="organizer-apps" className="mt-0">
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle>Organizer Applications</CardTitle>
              <CardDescription>Review and approve new organizer requests.</CardDescription>
            </CardHeader>
            {appsLoading ? (
              <CardContent><Skeleton className="h-48 w-full rounded-xl" /></CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/10 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4">Applicant</th>
                      <th className="px-6 py-4">Organization</th>
                      <th className="px-6 py-4">Experience</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {organizerApps.map(app => (
                      <tr key={app.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{app.displayName || "—"}</span>
                            <span className="text-xs text-muted-foreground">{app.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{app.organization}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {app.experience}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-500 border-green-500/20 hover:bg-green-500/10 hover:text-green-600"
                              onClick={() => handleApproveOrganizer(app.id, app.uid)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRejectOrganizer(app.id, app.uid)}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {organizerApps.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground text-sm">No pending organizer applications.</div>
                )}
              </div>
            )}
          </Card>

          <Card className="glass-card overflow-hidden mt-8">
            <CardHeader>
              <CardTitle>Pro Applications</CardTitle>
              <CardDescription>Review requests to upgrade or renew Pro membership.</CardDescription>
            </CardHeader>
            {appsLoading ? (
              <CardContent><Skeleton className="h-48 w-full rounded-xl" /></CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/10 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4">Applicant</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Note</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {proApps.map(app => (
                      <tr key={app.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{app.displayName || "—"}</span>
                            <span className="text-xs text-muted-foreground">{app.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={app.type === 'renewal' ? 'secondary' : 'default'} className="capitalize bg-amber-500/10 text-amber-600 border-amber-500/20">
                            {app.type || 'new'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {app.note || "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-500 border-green-500/20 hover:bg-green-500/10 hover:text-green-600"
                              onClick={() => handleApprovePro(app.id, app.uid)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRejectPro(app.id, app.uid)}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {proApps.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground text-sm">No pending pro applications.</div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Change Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={open => !open && setRoleDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{roleDialog.user?.displayName || roleDialog.user?.email}</p>
            <Select value={roleDialog.newRole} onValueChange={val => setRoleDialog(prev => ({ ...prev, newRole: val as string }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, user: null, newRole: "" })}>Cancel</Button>
            <Button onClick={applyRoleChange} disabled={savingRole}>
              {savingRole ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation */}
      <Dialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Permanently delete <strong>{deleteDialog.title}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, eventId: "", title: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteEvent} disabled={deletingEvent}>
              {deletingEvent ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Pro Dialog */}
      <Dialog open={extendProDialog.open} onOpenChange={open => !open && setExtendProDialog(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Extend Pro Membership</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{extendProDialog.email}</p>
            <Select value={extendProDialog.months} onValueChange={val => setExtendProDialog(prev => ({ ...prev, months: val ?? "1" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendProDialog({ open: false, uid: "", email: "", months: "1" })}>Cancel</Button>
            <Button onClick={applyProExtension} disabled={extendingPro} className="bg-amber-600 hover:bg-amber-700 text-white">
              {extendingPro ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
