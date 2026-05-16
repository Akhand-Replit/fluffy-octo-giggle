"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { EventData } from "@/lib/services/eventService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OrganizerEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyEvents() {
      if (!user) return;
      try {
        const q = query(collection(db, "events"), where("organizerId", "==", user.uid));
        const snapshot = await getDocs(q);
        const fetchedEvents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EventData[];
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching my events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMyEvents();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your Model UN conferences.
          </p>
        </div>
        <Button className="gap-2" render={<Link href="/dashboard/organizer/events/create" />} nativeButton={false}>
          <PlusCircle className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">No events found</CardTitle>
          <CardDescription className="max-w-md mx-auto mb-6">
            You haven't created any events yet. Start by creating your first Model United Nations conference.
          </CardDescription>
          <Button render={<Link href="/dashboard/organizer/events/create" />} nativeButton={false}>
            Create Your First Event
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                {event.coverUrl ? (
                  <div className="h-32 w-full bg-muted rounded-t-xl overflow-hidden relative">
                    <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md text-xs font-medium px-2 py-1 rounded-md">
                      {event.status === "draft" ? "Draft" : "Published"}
                    </div>
                  </div>
                ) : (
                  <div className="h-32 w-full bg-primary/10 rounded-t-xl flex items-center justify-center relative">
                    <Calendar className="w-10 h-10 text-primary/40" />
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md text-xs font-medium px-2 py-1 rounded-md">
                      {event.status === "draft" ? "Draft" : "Published"}
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{event.committees?.length || 0} Committees</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full" render={<Link href={`/dashboard/organizer/events/${event.id}`} />} nativeButton={false}>
                    Manage Conference
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
