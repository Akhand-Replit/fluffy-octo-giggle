"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConferenceCard, ConferenceStatus } from "@/components/dashboard/ConferenceCard";
import { useAuth } from "@/contexts/AuthContext";
import { getUserApplications, ApplicationData } from "@/lib/services/applicationService";
import { getEventById, getAllEvents, EventData, getEventsByIds } from "@/lib/services/eventService";
import { updateApplication } from "@/lib/services/applicationService";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventBrowseCard } from "@/components/dashboard/EventBrowseCard";

interface EnhancedApplication extends ApplicationData {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

export default function MyConferencesPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<EnhancedApplication[]>([]);
  const [publishedEvents, setPublishedEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Date ↓");

  useEffect(() => {
    const savedRole = localStorage.getItem("myConferences.viewPrefs.role");
    const savedSort = localStorage.getItem("myConferences.viewPrefs.sort");
    if (savedRole) setFilterRole(savedRole);
    if (savedSort) setSortBy(savedSort);
  }, []);

  useEffect(() => {
    localStorage.setItem("myConferences.viewPrefs.role", filterRole);
    localStorage.setItem("myConferences.viewPrefs.sort", sortBy);
  }, [filterRole, sortBy]);

  useEffect(() => {
    async function fetchMyConferences() {
      if (!user) return;

      const apps = await getUserApplications(user.uid);

      const eventIds = apps.map(a => a.eventId);
      const eventsData = await getEventsByIds(eventIds);
      const eventMap = new Map(eventsData.map(e => [e.id, e]));

      // Fetch event details for each application to get names/dates/locations
      const enhancedApps = apps.map((app) => {
          const event = eventMap.get(app.eventId);
          return {
            ...app,
            id: (app as any).id,
            eventName: event?.title || "Unknown Event",
            eventDate: event?.date || "Date Pending",
            eventLocation: event?.location || "Location Pending",
          };
      });

      // Fetch all published events
      const allEvents = await getAllEvents();
      const published = allEvents.filter(e => e.status === "published");
      
      setApplications(enhancedApps);
      setPublishedEvents(published);
      setLoading(false);
    }

    if (!authLoading && user) {
      fetchMyConferences();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  async function handleWithdraw(appId: string) {
    if (!confirm("Are you sure you want to withdraw your application?")) return;
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: "withdrawn" as any } : a));
    await updateApplication(appId, { status: "withdrawn" as any });
  }

  const sortedAndFiltered = applications
    .filter(a => filterRole === "All" || a.role === filterRole)
    .sort((a, b) => {
      if (sortBy.includes("Date")) {
        const da = new Date(a.eventDate).getTime() || 0;
        const db = new Date(b.eventDate).getTime() || 0;
        return sortBy === "Date ↓" ? db - da : da - db;
      }
      if (sortBy === "Status") {
        return a.status.localeCompare(b.status);
      }
      return 0; // Recently updated could use createdAt/updatedAt
    });

  const activeConferences = sortedAndFiltered.filter(a => ["pending", "approved", "waitlisted", "active"].includes(a.status));
  const pastConferences = sortedAndFiltered.filter(a => ["completed", "rejected", "withdrawn", "past"].includes(a.status));

  if (loading || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[300px] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conferences</h1>
          <p className="text-muted-foreground mt-1">
            Manage your conference applications or discover new events.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/organizer/events'}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          Organizer
        </button>
      </motion.div>

      <Tabs defaultValue="my-conferences" className="w-full">
        <TabsList className="mb-6 bg-background/50 backdrop-blur-md border border-border/50">
          <TabsTrigger value="my-conferences" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            My Conferences ({activeConferences.length})
          </TabsTrigger>
          <TabsTrigger value="browse" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Browse Conferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-conferences" className="mt-0">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-secondary/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Select value={filterRole} onValueChange={(v) => setFilterRole(v ?? "All")}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  <SelectItem value="Delegate">Delegate</SelectItem>
                  <SelectItem value="Chair">Chair</SelectItem>
                  <SelectItem value="Observer">Observer</SelectItem>
                  <SelectItem value="Head Delegate">Head Delegate</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "Date ↓")}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Date ↓">Date ↓</SelectItem>
                  <SelectItem value="Date ↑">Date ↑</SelectItem>
                  <SelectItem value="Status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Active & Pending</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {activeConferences.map((app, index) => (
              <div key={app.id} className="relative group">
                <ConferenceCard
                  id={app.id}
                  name={app.eventName}
                  date={app.eventDate}
                  location={app.eventLocation}
                  role={app.role}
                  committee={app.choices?.primary?.committee || "Pending"}
                  country={app.choices?.primary?.country || "Pending"}
                  status={app.status as ConferenceStatus}
                  delay={index * 0.1}
                />
                {app.status === "pending" && (
                  <button 
                    onClick={() => handleWithdraw(app.id)}
                    className="absolute top-4 right-4 bg-red-500/90 hover:bg-red-500 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            ))}
            {activeConferences.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground glass-card rounded-2xl border-dashed">
                <p className="text-xl font-medium mb-2">No active conferences</p>
                <p>You haven't applied to any upcoming events yet.</p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Past Conferences</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pastConferences.map((app, index) => (
              <ConferenceCard
                key={app.id}
                id={app.id}
                name={app.eventName}
                date={app.eventDate}
                location={app.eventLocation}
                role={app.role}
                committee={app.choices?.primary?.committee || "N/A"}
                country={app.choices?.primary?.country || "N/A"}
                status={app.status as ConferenceStatus}
                delay={index * 0.1}
              />
            ))}
            {pastConferences.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground glass-card rounded-2xl border-dashed">
                <p className="text-xl font-medium mb-2">No past conferences</p>
                <p>Your completed conferences will appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="browse" className="mt-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Discover Events</h2>
              <p className="text-sm text-muted-foreground">Find and apply to Model UN conferences around the world.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {publishedEvents.map((event, index) => {
              const hasApplied = applications.some(app => app.eventId === event.id);
              return (
                <EventBrowseCard 
                  key={event.id} 
                  event={event} 
                  delay={index * 0.1} 
                  hasApplied={hasApplied}
                />
              );
            })}
            
            {publishedEvents.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground glass-card rounded-2xl border-dashed">
                <p className="text-xl font-medium mb-2">No conferences available</p>
                <p>Check back later for new events to apply to.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
