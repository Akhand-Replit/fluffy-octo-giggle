'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CountryAssignmentRow, Applicant } from '@/components/features/organizer/CountryAssignmentRow';
import { Globe, Clock, Bot, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getEventById, Committee } from '@/lib/services/eventService';
import { getApplicationsByEvent, updateApplication, ApplicationData } from '@/lib/services/applicationService';
import { suggestCountryAssignments, applyAIAssignments } from '@/lib/services/aiAssignmentService';

export default function CountryManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { profile } = useAuth();
  const isPro = profile?.proStatus === 'active';

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [allApplications, setAllApplications] = useState<ApplicationData[]>([]);
  const [applicants, setApplicants] = useState<Record<string, Applicant[]>>({});
  const [activeCommittee, setActiveCommittee] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      const [event, apps] = await Promise.all([
        getEventById(eventId),
        getApplicationsByEvent(eventId),
      ]);
      if (!event) { setLoading(false); return; }

      const approved = apps.filter(a => a.status === 'approved');
      setAllApplications(apps);
      setCommittees(event.committees ?? []);

      const map: Record<string, Applicant[]> = {};
      for (const c of event.committees ?? []) {
        const committeeApps = approved.filter(a =>
          a.assignedCommittee === c.name || a.choices?.primary?.committee === c.name
        );
        map[c.name] = committeeApps.map(a => ({
          id: (a as any).id,
          name: a.applicantName ?? a.userId,
          email: a.applicantEmail ?? '',
          experience: a.experience ?? '',
          preferences: [
            a.choices?.primary?.country,
            a.choices?.secondary?.country,
            a.choices?.tertiary?.country,
          ].filter(Boolean) as string[],
          assignedCountry: a.assignedCountry ?? null,
        }));
      }
      setApplicants(map);
      if (event.committees?.length) setActiveCommittee(event.committees[0].name);
      setLoading(false);
    }
    load();
  }, [eventId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAssign = (applicantId: string, country: string) => {
    setApplicants(prev => {
      const updated = { ...prev };
      updated[activeCommittee] = (updated[activeCommittee] ?? []).map(app =>
        app.id === applicantId ? { ...app, assignedCountry: country === 'unassigned' ? null : country } : app
      );
      return updated;
    });
  };

  const handleSave = async () => {
    const currentApplicants = applicants[activeCommittee] ?? [];
    await Promise.all(
      currentApplicants
        .filter(a => a.assignedCountry)
        .map(a => updateApplication(a.id, { assignedCountry: a.assignedCountry! }))
    );
  };

  const handleAutoAssign = async () => {
    if (!isPro) {
      alert('Pro Feature: AI Country Assignment requires a Pro subscription.');
      return;
    }
    setIsAiLoading(true);
    const committee = committees.find(c => c.name === activeCommittee);
    if (!committee) { setIsAiLoading(false); return; }
    const suggestions = suggestCountryAssignments(allApplications, committee);
    await applyAIAssignments(suggestions);
    setApplicants(prev => {
      const updated = { ...prev };
      updated[activeCommittee] = (updated[activeCommittee] ?? []).map(app => {
        const s = suggestions.find(sg => sg.applicationId === app.id);
        return s ? { ...app, assignedCountry: s.suggestedCountry } : app;
      });
      return updated;
    });
    setIsAiLoading(false);
  };

  const committeeApps = applicants[activeCommittee] ?? [];
  const unassignedCount = committeeApps.filter(a => !a.assignedCountry).length;
  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Country Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Assign countries to applicants manually or use AI auto-assignment.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <Clock className="w-5 h-5 text-violet-600" />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Assignment Deadline</p>
            <p className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">{formatTime(timeLeft)}</p>
          </div>
        </div>
      </div>

      {committees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No committees configured for this event.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Delegation Matrix
                </CardTitle>
                <CardDescription>
                  {unassignedCount > 0
                    ? <span className="text-amber-600 font-medium">{unassignedCount} applicants need assignment.</span>
                    : <span className="text-green-600 font-medium">All applicants assigned!</span>
                  }
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAutoAssign} disabled={isAiLoading || unassignedCount === 0} className="gap-2">
                  {isAiLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 text-violet-600" />}
                  AI Auto-Assign
                </Button>
                <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeCommittee} onValueChange={setActiveCommittee} className="w-full">
              <div className="px-6 pt-4 border-b">
                <TabsList className="mb-4">
                  {committees.map(c => (
                    <TabsTrigger key={c.name} value={c.name} className="gap-2">
                      {c.name}
                      {(applicants[c.name] ?? []).filter(a => !a.assignedCountry).length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 rounded-full text-[10px]">
                          {(applicants[c.name] ?? []).filter(a => !a.assignedCountry).length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {committees.map(c => (
                <TabsContent key={c.name} value={c.name} className="p-6 m-0 space-y-4">
                  {(applicants[c.name] ?? []).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No approved applicants for this committee yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(applicants[c.name] ?? []).map(app => (
                        <CountryAssignmentRow
                          key={app.id}
                          applicant={app}
                          availableCountries={c.countries ?? []}
                          onAssign={handleAssign}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 p-4 rounded-lg border border-blue-200 dark:border-blue-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Conflict Detection System Active</p>
          <p>
            The system automatically cross-references an applicant's past events. If they are assigned a country they have represented before, a yellow conflict warning will appear. AI Auto-Assign will strictly avoid conflicts.
          </p>
        </div>
      </div>
    </div>
  );
}
