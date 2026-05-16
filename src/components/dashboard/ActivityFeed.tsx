"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentActivities, ActivityData } from "@/lib/services/activityService";
import { formatDistanceToNow } from "date-fns";

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivities(10).then(data => {
      setActivities(data);
      setLoading(false);
    });
  }, []);

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-x-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <Skeleton className="flex-1 h-16 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <p className="text-sm">No recent activity yet. Apply to a conference to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.08 }}
          className="flex gap-x-4"
        >
          <div className="relative flex flex-col items-center">
            {index !== activities.length - 1 && (
              <div className="absolute top-10 bottom-[-1.5rem] w-px bg-border/50" />
            )}
            <Avatar className="h-10 w-10 ring-2 ring-background z-10 shadow-sm shadow-black/20">
              <AvatarFallback className="bg-primary/20 text-primary font-medium">
                {getInitials(activity.actorName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="glass-card flex-1 rounded-2xl p-4 sm:p-5 mb-2 hover:border-primary/20 transition-colors">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
              <div>
                <span className="font-semibold text-foreground mr-1">{activity.actorName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-border/50 mr-2">
                  {activity.actorRole}
                </span>
                <span className="text-muted-foreground mr-1">{activity.action}</span>
                <span className="font-medium text-foreground">{activity.targetTitle}</span>
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.createdAt
                  ? formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })
                  : "just now"}
              </time>
            </div>
          </div>
        </motion.div>
      ))}

      {activities.length >= 10 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            View older activity
          </button>
        </motion.div>
      )}
    </div>
  );
}
