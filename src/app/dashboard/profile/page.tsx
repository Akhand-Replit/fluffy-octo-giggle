"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { 
  MapPin, Edit, Calendar, FileText, Award, 
  ArrowRight, ExternalLink 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);
export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ conferences: 0, articles: 0, awards: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProfileData() {
      if (!user) return;
      try {
        // Fetch stats
        const [appsSnap, articlesSnap] = await Promise.all([
          getDocs(query(collection(db, "applications"), where("userId", "==", user.uid), where("status", "==", "approved"))),
          getDocs(query(collection(db, "articles"), where("authorId", "==", user.uid)))
        ]);
        
        // Fetch activities
        const activitiesQuery = query(
          collection(db, "activities"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const activitiesSnap = await getDocs(activitiesQuery);
        
        setStats({
          conferences: appsSnap.size,
          articles: articlesSnap.size,
          awards: 0 // Will implement awards collection later
        });
        
        setRecentActivities(activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchProfileData();
    }
  }, [user, authLoading]);

  // TODO: Future extension: support viewing other user profiles via /dashboard/profile/[uid]

  if (authLoading || loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-20">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Hero Block */}
      <Card className="overflow-hidden border-none shadow-xl bg-background glass-card">
        <div className="h-48 w-full bg-gradient-to-r from-primary/80 via-indigo-500/80 to-purple-600/80 relative">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-4 right-4 z-10">
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md" render={<Link href="/dashboard/settings?tab=profile" />} nativeButton={false}>
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          </div>
        </div>
        
        <CardContent className="relative px-6 pb-8 sm:px-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 mb-6">
            <Avatar className="w-32 h-32 border-4 border-background rounded-2xl shadow-xl bg-background">
              <AvatarImage src={user?.photoURL || ""} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary rounded-2xl">
                {(profile.displayName || profile.firstName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold tracking-tight">{profile.displayName || `${profile.firstName} ${profile.lastName}`}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
                <Badge variant="outline" className="capitalize text-primary border-primary/20 bg-primary/5">
                  {profile.role || "Delegate"}
                </Badge>
                {profile.city && profile.country && (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.city}, {profile.country}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* About Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                {profile.bio ? (
                  <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                ) : (
                  <div className="bg-secondary/20 p-4 rounded-xl text-center border border-dashed border-border/50">
                    <p className="text-muted-foreground text-sm mb-2">No bio added yet.</p>
                    <Link href="/dashboard/settings?tab=profile" className="text-primary text-sm font-medium hover:underline">
                      Add a bio →
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/40">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Nationality</span>
                  <span className="font-medium text-sm">{profile.nationality || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Occupation</span>
                  <span className="font-medium text-sm capitalize">{profile.occupation || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Institution</span>
                  <span className="font-medium text-sm truncate block" title={profile.institution}>{profile.institution || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Field of Study</span>
                  <span className="font-medium text-sm truncate block" title={profile.fieldOfStudy}>{profile.fieldOfStudy || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map(act => (
                    <div key={act.id} className="flex gap-4 p-4 rounded-xl bg-secondary/5 border border-border/40 hover:bg-secondary/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {act.type === "application" ? <Calendar className="w-5 h-5 text-primary" /> : 
                         act.type === "article" ? <FileText className="w-5 h-5 text-primary" /> : 
                         <Award className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {act.action} <span className="font-semibold">{act.targetTitle}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {act.createdAt ? formatDistanceToNow(act.createdAt.toDate(), { addSuffix: true }) : "recently"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-secondary/20 p-8 rounded-xl text-center border border-dashed border-border/50">
                  <p className="text-muted-foreground text-sm mb-2">No recent activity.</p>
                  <Link href="/dashboard/events" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                    Browse upcoming events <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* MUN Stats Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>MUN Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Conferences</span>
                  </div>
                  <span className="text-xl font-bold">{stats.conferences}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Articles</span>
                  </div>
                  <span className="text-xl font-bold">{stats.articles}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/10 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Awards</span>
                  </div>
                  <span className="text-xl font-bold">{stats.awards}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connect Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {profile.instagram ? (
                  <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/20 transition-colors border border-transparent hover:border-border/40 group">
                    <div className="flex items-center gap-3">
                      <div className="text-pink-500 bg-pink-500/10 p-2 rounded-lg"><InstagramIcon className="w-5 h-5" /></div>
                      <span className="text-sm font-medium">Instagram</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : null}
                
                {profile.linkedin ? (
                  <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/20 transition-colors border border-transparent hover:border-border/40 group">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-500 bg-blue-500/10 p-2 rounded-lg"><LinkedinIcon className="w-5 h-5" /></div>
                      <span className="text-sm font-medium">LinkedIn</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : null}

                {(!profile.instagram && !profile.linkedin) && (
                  <div className="bg-secondary/20 p-4 rounded-xl text-center border border-dashed border-border/50">
                    <p className="text-muted-foreground text-sm mb-2">No social profiles linked.</p>
                    <Link href="/dashboard/settings?tab=profile" className="text-primary text-sm font-medium hover:underline">
                      Add social links →
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
