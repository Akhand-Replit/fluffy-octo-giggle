"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventById, EventData } from "@/lib/services/eventService";
import { ApplicationWizard } from "@/components/dashboard/wizard/ApplicationWizard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplyPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !user) {
      router.push(`/login?redirect=/events/${eventId}/apply`);
      return;
    }

    async function fetchEvent() {
      if (eventId) {
        const data = await getEventById(eventId);
        setEvent(data);
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchEvent();
    }
  }, [eventId, user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-8 max-w-3xl">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the event you're trying to apply for.</p>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto py-12 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Application for {event.title}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Please fill out the details below carefully. Your preferences will be considered during the country assignment process.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <ApplicationWizard event={event} userId={user?.uid || ""} />
        </div>
      </div>
    </div>
  );
}
