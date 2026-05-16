"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventById, EventData } from "@/lib/services/eventService";
import { getEventPartners, Partner } from "@/lib/services/partnerService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, MapPinIcon, UsersIcon, ExternalLinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (eventId) {
        const [data, partnersData] = await Promise.all([
          getEventById(eventId),
          getEventPartners(eventId)
        ]);
        setEvent(data);
        setPartners(partnersData);
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-8">The conference you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push("/events")}>Back to Events</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/events")} className="mb-4">
          &larr; Back to Events
        </Button>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{event.title}</h1>
        
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-5 h-5" />
            <span>{event.location} ({event.format})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {event.coverUrl ? (
            <div className="w-full h-[400px] rounded-2xl overflow-hidden bg-muted relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-[300px] rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary/40 text-center p-6">{event.title}</span>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold mb-4">About this Conference</h2>
            <div className="prose prose-invert max-w-none">
              <p>{event.description || "No description provided for this event."}</p>
            </div>
          </div>
          
          {event.committees && event.committees.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Committees</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.committees.map((com, idx) => (
                  <Card key={idx} className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-primary" />
                        {com.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {com.countries?.length || 0} Countries/Positions Available
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {partners && partners.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Event Partners</h2>
              <div className="relative w-full bg-secondary/10 rounded-xl border border-border/50 px-12 py-8 flex items-center justify-center">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {partners.map((partner, idx) => (
                      <CarouselItem key={`${partner.id || 'p'}-${idx}`} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                        <Dialog>
                          <DialogTrigger className="w-full h-full text-left p-0 border-0 bg-transparent cursor-pointer block">
                            <div className="flex flex-col items-center justify-center gap-3 grayscale hover:grayscale-0 transition-all duration-300 group">
                              {partner.logoUrl ? (
                                <div className="h-24 w-full relative flex items-center justify-center bg-white/5 rounded-lg p-3 border border-white/5 group-hover:border-primary/30 transition-colors">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={partner.logoUrl} alt={partner.name} className="max-h-full max-w-full object-contain drop-shadow-md" />
                                </div>
                              ) : (
                                <div className="h-24 w-full flex items-center justify-center bg-white/5 rounded-lg border border-white/5 group-hover:border-primary/30 transition-colors">
                                  <span className="font-bold text-lg text-center px-2">{partner.name}</span>
                                </div>
                              )}
                              {partner.tier && (
                                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                  {partner.tier} Partner
                                </span>
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>{partner.name}</DialogTitle>
                              <DialogDescription>
                                {partner.tier ? `${partner.tier.charAt(0).toUpperCase() + partner.tier.slice(1)} Partner` : "Event Partner"}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                              {partner.logoUrl && (
                                <div className="h-32 w-full flex items-center justify-center bg-secondary/20 rounded-lg p-4">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={partner.logoUrl} alt={partner.name} className="max-h-full max-w-full object-contain" />
                                </div>
                              )}
                              {partner.description && (
                                <p className="text-sm text-foreground">{partner.description}</p>
                              )}
                              {partner.websiteUrl && (
                                <Button render={<a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" />} className="w-full mt-2 flex items-center justify-center gap-2">
                                  Visit Website <ExternalLinkIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>
          )}
        </div>

        <div>
          <Card className="sticky top-24 glass-card border-primary/20">
            <CardHeader>
              <CardTitle>Application Open</CardTitle>
              <CardDescription>Join as a Delegate or Observer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium mb-1">Status</p>
                <p className="text-green-500 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  Accepting Applications
                </p>
              </div>
              
              {!user ? (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground text-center">You must be logged in to apply.</p>
                  <Button className="w-full" onClick={() => router.push(`/login?redirect=/events/${eventId}`)}>
                    Log In to Apply
                  </Button>
                </div>
              ) : (
                <Link href={`/events/${eventId}/apply`} className="block pt-2">
                  <Button size="lg" className="w-full text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all">
                    Apply Now
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
