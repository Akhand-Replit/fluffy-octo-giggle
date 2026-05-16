"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ChevronRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type ConferenceStatus = "pending" | "approved" | "rejected" | "past";

interface ConferenceCardProps {
  id: string;
  name: string;
  date: string;
  location: string;
  role: string;
  committee: string;
  country?: string;
  status: ConferenceStatus;
  delay?: number;
}

export function ConferenceCard({
  id,
  name,
  date,
  location,
  role,
  committee,
  country,
  status,
  delay = 0,
}: ConferenceCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Approved", border: "border-green-500/20" };
      case "pending":
        return { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Pending", border: "border-yellow-500/20" };
      case "rejected":
        return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Waitlisted/Rejected", border: "border-red-500/20" };
      case "past":
        return { icon: CheckCircle2, color: "text-muted-foreground", bg: "bg-muted/50", label: "Completed", border: "border-border/50" };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors mb-1">
              {name}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground gap-4">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {date}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {location}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="bg-white/5 dark:bg-black/10 rounded-xl p-3 border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">Role & Committee</p>
            <p className="font-medium text-sm text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {role} • {committee}
            </p>
          </div>
          <div className="bg-white/5 dark:bg-black/10 rounded-xl p-3 border border-border/40">
            <p className="text-xs text-muted-foreground mb-1">Assigned Country</p>
            <p className="font-medium text-sm text-foreground">
              {country || "Pending Assignment"}
            </p>
          </div>
        </div>
        
        {/* Status Tracker */}
        {status !== "past" && (
          <div className="mb-6 relative">
            <div className="absolute top-2 left-0 w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${status === 'approved' ? 'bg-green-500 w-full' : status === 'pending' ? 'bg-yellow-500 w-1/2' : 'bg-red-500 w-full'}`}
              />
            </div>
            <div className="flex justify-between relative z-10 pt-4 text-xs text-muted-foreground">
              <span>Applied</span>
              <span className="text-center">Under Review</span>
              <span className="text-right">Decision</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button variant="outline" className="bg-transparent border-border/60 hover:bg-secondary/50" render={<Link href={`/dashboard/conferences/${id}`} />} nativeButton={false}>
            View Details
          </Button>
          <Button className="shadow-lg shadow-primary/20 group-hover:shadow-primary/30" render={<Link href={`/dashboard/conferences/${id}`} />} nativeButton={false}>
            Go to Portal
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
