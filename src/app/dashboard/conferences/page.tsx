"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConferenceCard, ConferenceStatus } from "@/components/dashboard/ConferenceCard";
import { useAuth } from "@/contexts/AuthContext";
import { getUserApplications, ApplicationData } from "@/lib/services/applicationService";
import { getEventById, EventData } from "@/lib/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";

interface EnhancedApplication extends ApplicationData {
  id: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

export default function MyConferencesPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<EnhancedApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyConferences() {
      if (!user) return;

      const apps = await getUserApplications(user.uid);

      // Fetch event details for each application to get names/dates/locations
      const enhancedApps = await Promise.all(
        apps.map(async (app) => {
          const event = await getEventById(app.eventId);
          return {
            ...app,
            id: (app as any).id,
            eventName: event?.title || "Unknown Event",
            eventDate: event?.date || "Date Pending",
            eventLocation: event?.location || "Location Pending",
          };
        })
      );

      setApplications(enhancedApps);
      setLoading(false);
    }

    if (!authLoading && user) {
      fetchMyConferences();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const activeConferences = applications.filter(a => a.status !== "past");
  const pastConferences = applications.filter(a => a.status === "past");

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
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Active & Pending</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {activeConferences.map((app, index) => (
              <ConferenceCard
                key={app.id}
                id={app.id}
                name={app.eventName}
                date={app.eventDate}
                location={app.eventLocation}
                role={app.role}
                committee={app.choices.primary.committee}
                country={app.choices.primary.country}
                status={app.status as ConferenceStatus}
                delay={index * 0.1}
              />
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
                committee={app.choices.primary.committee}
                country={app.choices.primary.country}
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
          <div className="py-20 text-center text-muted-foreground glass-card rounded-2xl border-dashed">
            <p className="text-xl font-medium mb-2">Browse Conferences</p>
            <p>Coming soon: Discover and apply to Model UN conferences around the world.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
