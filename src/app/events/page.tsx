"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getAllEvents, EventData } from "@/lib/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const data = await getAllEvents();
      setEvents(data);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Conferences</h1>
          <p className="text-muted-foreground mt-2">Discover and apply to upcoming Model UN conferences worldwide.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="flex flex-col h-[200px]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-secondary/10 rounded-2xl">
          <h2 className="text-2xl font-semibold mb-2">No Conferences Found</h2>
          <p>There are currently no upcoming conferences to apply for. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col glass-card hover:border-primary/50 transition-colors">
              {event.coverUrl && (
                <div className="w-full h-32 overflow-hidden rounded-t-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{event.date} • {event.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                    {event.format}
                  </span>
                </div>
                <Link href={`/events/${event.id}`} className={buttonVariants({ className: "w-full" })}>
                  View Details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
