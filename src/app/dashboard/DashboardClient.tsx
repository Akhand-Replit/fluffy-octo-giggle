"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { FileText, Users, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getUserApplications } from "@/lib/services/applicationService";
import { getUserProfile, UserProfile } from "@/lib/services/userService";
import { getAllEvents, EventData } from "@/lib/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface DashboardClientProps {
  initialStats?: any;
  initialRecommendations?: any;
  serverError?: string | null;
}

export default function DashboardClient({ initialStats, initialRecommendations, serverError }: DashboardClientProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState(initialStats || {
    conferences: 0,
    papers: 0,
    achievements: 0,
    upcomingCount: 0,
    pastCount: 0
  });
  const [recommendedEvents, setRecommendedEvents] = useState<EventData[]>(initialRecommendations || []);
  const [loading, setLoading] = useState(!initialStats && true);
  const [error, setError] = useState(serverError);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        const [userProfile, userApps, achievements] = await Promise.all([
          getUserProfile(user.uid),
          getUserApplications(user.uid),
          import("@/lib/services/resultService").then(m => m.getUserAchievements(user.uid))
        ]);

        setProfile(userProfile);
        
        if (!initialStats) {
          const upcoming = userApps.filter(a => a.status !== "past").length;
          const past = userApps.filter(a => a.status === "past").length;
          const papers = userApps.filter(a => (a as any).positionPaperUrl != null).length;
          
          setStats({
            conferences: userApps.length,
            upcomingCount: upcoming,
            pastCount: past,
            papers,
            achievements: achievements.length
          });
        }

        if (!initialRecommendations) {
          const allEvents = await getAllEvents();
          const appliedEventIds = new Set(userApps.map(a => a.eventId));
          const recommended = allEvents
            .filter(e => !appliedEventIds.has(e.id))
            .slice(0, 3);
          
          setRecommendedEvents(recommended);
        }
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchDashboardData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Oops! Something went wrong</h2>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
          <RefreshCcw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-gradient">{user?.displayName?.split(' ')[0] || "User"}</span>
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Here's what's happening with your MUN journey today.
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary backdrop-blur-sm">
              {profile?.role || "Delegate"}
            </span>
          </p>
        </div>
        <Button 
          className="shrink-0 shadow-lg shadow-primary/25 rounded-full px-6"
          onClick={() => router.push("/events")}
        >
          Explore Conferences
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="My Conferences"
          value={stats.conferences.toString()}
          description={`${stats.upcomingCount} Active, ${stats.pastCount} Past`}
          icon={Users}
          delay={0.1}
        />
        <StatCard 
          title="Position Papers"
          value={stats.papers.toString()}
          description="Submissions Track"
          icon={FileText}
          delay={0.2}
        />
        <StatCard 
          title="Achievements"
          value={stats.achievements.toString()}
          description="Recognition & Awards"
          icon={Award}
          delay={0.3}
        />
      </div>

      {/* Main Content Area */}
      {stats.conferences === 0 && recommendedEvents.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border-border/50">
          <h2 className="text-2xl font-bold mb-2">Ready to start your MUN journey?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">You haven't applied to any conferences yet. Explore upcoming events to get started.</p>
          <Button onClick={() => router.push("/events")} size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25">
            Browse Conferences
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          </div>
          <ActivityFeed />
        </div>

        {/* Sidebar / Recommended */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-border/50">
            <h3 className="text-lg font-semibold tracking-tight mb-4">Recommended Conferences</h3>
            <div className="space-y-4">
              {recommendedEvents.length > 0 ? (
                recommendedEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="group relative flex gap-x-4 p-3 -mx-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                      {event.coverUrl ? (
                        <img src={event.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {event.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No new recommendations available.</p>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-2 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm"
                onClick={() => router.push("/events")}
              >
                View All
              </Button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
