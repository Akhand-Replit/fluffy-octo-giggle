"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Globe2, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EventData } from "@/lib/services/eventService";

interface EventBrowseCardProps {
  event: EventData;
  delay?: number;
  hasApplied?: boolean;
}

export function EventBrowseCard({ event, delay = 0, hasApplied = false }: EventBrowseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group flex flex-col h-full"
    >
      <div className="h-32 bg-gradient-to-br from-primary/80 to-indigo-600/80 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
        {event.coverUrl && (
          <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
        )}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="bg-background/80 backdrop-blur-md text-foreground text-xs px-2.5 py-1 rounded-full font-medium">
            {event.format || "In-person"}
          </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0 text-primary/70" />
            <span className="truncate">{event.date || "Date TBA"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0 text-primary/70" />
            <span className="truncate">{event.location || "Location TBA"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0 text-primary/70" />
            <span>{event.committees?.length || 0} Committees</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 mt-auto">
          {hasApplied ? (
            <Button variant="secondary" className="w-full opacity-70 pointer-events-none" disabled>
              Already Applied
            </Button>
          ) : (
            <Button className="w-full shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all" render={<Link href={`/events/${event.id}`} />} nativeButton={false}>
              View & Apply
              <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
