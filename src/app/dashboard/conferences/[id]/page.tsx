"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, EventData } from "@/lib/services/eventService";
import { getUserApplications, ApplicationData } from "@/lib/services/applicationService";
import { Skeleton } from "@/components/ui/skeleton";
import { PositionPaperUpload } from "@/components/features/delegate/PositionPaperUpload";
import { ScheduleViewer } from "@/components/features/delegate/ScheduleViewer";
import { ComplaintSystem } from "@/components/features/delegate/ComplaintSystem";
import { CertificateDownload } from "@/components/features/delegate/CertificateDownload";
import { StudyGuideViewer } from "@/components/features/delegate/StudyGuideViewer";
import { AnnouncementViewer } from "@/components/features/delegate/AnnouncementViewer";
import { RoomNotifications } from "@/components/features/delegate/RoomNotifications";
import { FacultyAdvisorPanel } from "@/components/features/delegate/FacultyAdvisorPanel";
import { TeamDelegationPanel } from "@/components/features/delegate/TeamDelegationPanel";
import { FoodCouponsModule } from "@/components/features/delegate/modules/FoodCouponsModule";
import { TransportModule } from "@/components/features/delegate/modules/TransportModule";
import { AccommodationModule } from "@/components/features/delegate/modules/AccommodationModule";
import { DressCodeModule } from "@/components/features/delegate/modules/DressCodeModule";
import { LiveMUNModule } from "@/components/features/delegate/modules/LiveMUNModule";
import { ProGate } from "@/components/ProGate";
import {
  Calendar, MapPin, Users, Globe2, FileText, Clock,
  AlertTriangle, Award, Trophy, Star, Megaphone, Utensils,
  Bus, Hotel, Shirt, Radio
} from "lucide-react";
import { getDelegateMarking, Marking } from "@/lib/services/markingService";

export default function ConferencePortalPage() {
  const params = useParams();
  const conferenceId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [marking, setMarking] = useState<Marking | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [announcementUnread, setAnnouncementUnread] = useState(0);

  useEffect(() => {
    async function loadPortalData() {
      if (!user || !conferenceId) return;

      const userApps = await getUserApplications(user.uid);
      const currentApp = userApps.find(
        app => (app as any).id === conferenceId || app.eventId === conferenceId
      );

      const eventData = currentApp
        ? await getEventById(currentApp.eventId)
        : await getEventById(conferenceId);

      setEvent(eventData || null);
      setApplication(currentApp || null);

      if (currentApp) {
        const appId = (currentApp as any).id;
        if (appId) {
          const mark = await getDelegateMarking(appId, user.uid);
          setMarking(mark);
        } else {
          setMarking(null);
        }
      } else {
        setMarking(null);
      }

      setLoading(false);
    }

    if (!authLoading && user) {
      loadPortalData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, conferenceId]);

  if (loading || authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  if (!event || !application) {
    return (
      <div className="py-20 text-center text-muted-foreground glass-card rounded-2xl border-dashed">
        <p className="text-xl font-medium mb-2">Conference not found</p>
        <p>We couldn't find the details for this conference.</p>
      </div>
    );
  }

  const appId = (application as any).id as string;
  const optionalModules: string[] = (event as any).optionalModules || [];
  const committeeId = application.assignedCommittee || application.choices?.primary?.committee;
  const isFacultyAdvisor = application.role === "Faculty Advisor" || application.role === "faculty_advisor";
  const isTeamLead = application.role === "Team Delegation Lead" || application.role === "team_head";
  const hasDelegation = !!(application as any).delegationId || !!(application as any).teamApplicationParentId || isTeamLead;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                {application.status}
              </span>
              <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full uppercase tracking-wider">
                {application.role}
              </span>
              {hasDelegation && (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Team
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{event.title}</h1>
            <p className="text-muted-foreground max-w-2xl">{event.description}</p>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span>{event.location}</span>
            </div>
            {/* Room notification bell — only for non-faculty delegates */}
            {!isFacultyAdvisor && committeeId && (
              <RoomNotifications
                eventId={event.id!}
                committeeId={committeeId}
                applicationId={appId}
              />
            )}
          </div>
        </div>

        {/* Assigned details */}
        {!isFacultyAdvisor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/40">
            <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Committee</p>
                <p className="text-lg font-medium">{committeeId}</p>
              </div>
            </div>
            <div className="bg-background/40 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Globe2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Country</p>
                <p className="text-lg font-medium">
                  {application.assignedCountry || application.choices.primary.country || "Pending Assignment"}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Faculty Advisor — completely different portal layout */}
      {isFacultyAdvisor ? (
        <FacultyAdvisorPanel
          event={event}
          myApplication={application}
          advisorUid={user!.uid}
        />
      ) : (
        <>
          {/* Team section (if member of a delegation) */}
          {hasDelegation && (
            <TeamDelegationPanel
              event={event}
              myApplication={application as ApplicationData & { id?: string }}
            />
          )}

          {/* Portal Tabs */}
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="mb-6 bg-background/50 backdrop-blur-md border border-border/50 overflow-x-auto flex-nowrap justify-start w-full md:w-auto h-auto p-1 gap-1">
              <TabsTrigger value="documents" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                <FileText className="w-4 h-4" /> Documents
              </TabsTrigger>
              <TabsTrigger value="announcements" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap relative">
                <Megaphone className="w-4 h-4" /> Announcements
                {announcementUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {announcementUnread > 9 ? "9+" : announcementUnread}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="schedule" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                <Clock className="w-4 h-4" /> Schedule
              </TabsTrigger>
              <TabsTrigger value="complaints" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                <AlertTriangle className="w-4 h-4" /> Requests
              </TabsTrigger>
              {optionalModules.includes("food") && (
                <TabsTrigger value="food" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                  <Utensils className="w-4 h-4" /> Food
                </TabsTrigger>
              )}
              {optionalModules.includes("transport") && (
                <TabsTrigger value="transport" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                  <Bus className="w-4 h-4" /> Transport
                </TabsTrigger>
              )}
              {optionalModules.includes("accommodation") && (
                <TabsTrigger value="accommodation" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                  <Hotel className="w-4 h-4" /> Accommodation
                </TabsTrigger>
              )}
              {optionalModules.includes("dresscode") && (
                <TabsTrigger value="dresscode" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                  <Shirt className="w-4 h-4" /> Dress Code
                </TabsTrigger>
              )}
              {optionalModules.includes("livemun") && (
                <TabsTrigger value="livemun" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                  <Radio className="w-4 h-4" /> Live MUN
                </TabsTrigger>
              )}
              <TabsTrigger value="certificate" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                <Award className="w-4 h-4" /> Certificates
              </TabsTrigger>
              <TabsTrigger value="results" className="py-3 px-5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-xl whitespace-nowrap">
                <Trophy className="w-4 h-4" /> Results
              </TabsTrigger>
            </TabsList>

            <motion.div
              key="tabs-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Documents — position paper + study guide */}
              <TabsContent value="documents" className="mt-0 outline-none space-y-6">
                <PositionPaperUpload application={application} event={event} />
                <StudyGuideViewer eventId={event.id!} committeeName={committeeId} />
              </TabsContent>

              {/* Announcements */}
              <TabsContent value="announcements" className="mt-0 outline-none">
                {appId && (
                  <AnnouncementViewer
                    eventId={event.id!}
                    applicationId={appId}
                    onUnreadCount={setAnnouncementUnread}
                  />
                )}
              </TabsContent>

              {/* Schedule */}
              <TabsContent value="schedule" className="mt-0 outline-none">
                <ScheduleViewer event={event} />
              </TabsContent>

              {/* Requests / Complaints */}
              <TabsContent value="complaints" className="mt-0 outline-none">
                <ComplaintSystem application={application} event={event} />
              </TabsContent>

              {/* Optional Modules */}
              {optionalModules.includes("food") && (
                <TabsContent value="food" className="mt-0 outline-none">
                  <FoodCouponsModule eventId={event.id!} applicationId={appId} />
                </TabsContent>
              )}
              {optionalModules.includes("transport") && (
                <TabsContent value="transport" className="mt-0 outline-none">
                  <TransportModule eventId={event.id!} applicationId={appId} />
                </TabsContent>
              )}
              {optionalModules.includes("accommodation") && (
                <TabsContent value="accommodation" className="mt-0 outline-none">
                  <AccommodationModule eventId={event.id!} delegateUid={user!.uid} />
                </TabsContent>
              )}
              {optionalModules.includes("dresscode") && (
                <TabsContent value="dresscode" className="mt-0 outline-none">
                  <DressCodeModule event={event} />
                </TabsContent>
              )}
              {optionalModules.includes("livemun") && (
                <TabsContent value="livemun" className="mt-0 outline-none">
                  <ProGate feature="Live MUN Module">
                    <LiveMUNModule eventId={event.id!} />
                  </ProGate>
                </TabsContent>
              )}

              {/* Certificates */}
              <TabsContent value="certificate" className="mt-0 outline-none">
                <CertificateDownload
                  eventId={event.id!}
                  delegateUid={user!.uid}
                  applicationId={appId}
                  delegateName={user?.displayName || "Delegate Name"}
                  conferenceName={event.title}
                  committeeName={committeeId}
                  countryName={application.assignedCountry || application.choices.primary.country}
                  date={event.date}
                  role={application.role}
                />
              </TabsContent>

              {/* Results */}
              <TabsContent value="results" className="mt-0 outline-none">
                {marking === undefined ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <Skeleton className="h-8 w-1/3 mx-auto mb-4" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                ) : marking === null ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <Trophy className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Results Not Yet Published</h3>
                    <p className="text-muted-foreground text-sm">
                      Your chair hasn't submitted scores yet. Check back after the conference.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="text-xl font-bold mb-1">Your Score</h3>
                      <p className="text-muted-foreground text-sm mb-6">Graded by committee chair.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[
                          { label: "Debate Performance", score: marking.scores.debate, max: 40, color: "blue" },
                          { label: "Position Paper", score: marking.scores.positionPaper, max: 30, color: "purple" },
                          { label: "Diplomacy & Lobbying", score: marking.scores.diplomacy, max: 30, color: "green" },
                        ].map(({ label, score, max, color }) => (
                          <div key={label} className="bg-secondary/10 rounded-xl p-4 border border-border/30 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                            <p className={`text-4xl font-bold text-${color}-500`}>{score}</p>
                            <p className="text-xs text-muted-foreground mt-1">/ {max}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-primary/10 rounded-xl p-5 border border-primary/20 text-center mb-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Score</p>
                        <p className="text-5xl font-bold text-primary">{marking.scores.total}</p>
                        <p className="text-sm text-muted-foreground mt-1">/ 100</p>
                        <div className="mt-3 h-2 bg-secondary/30 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${marking.scores.total}%` }} />
                        </div>
                      </div>
                      {marking.feedback && (
                        <div className="bg-secondary/10 rounded-xl p-4 border border-border/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" /> Chair Feedback
                          </p>
                          <p className="text-sm leading-relaxed">{marking.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </motion.div>
          </Tabs>
        </>
      )}
    </div>
  );
}
