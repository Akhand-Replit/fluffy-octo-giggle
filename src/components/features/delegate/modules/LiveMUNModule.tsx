"use client";

import { useEffect, useState } from "react";
import { subscribeLiveSessions, LiveSession } from "@/lib/services/optionalModulesService";
import { Badge } from "@/components/ui/badge";
import { Radio, Mic, Globe2, BookOpen, Loader2 } from "lucide-react";

interface LiveMUNModuleProps {
  eventId: string;
}

export function LiveMUNModule({ eventId }: LiveMUNModuleProps) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeLiveSessions(eventId, (data) => {
      setSessions(data);
      setLoading(false);
    });
    return () => unsub();
  }, [eventId]);

  const liveSessions = sessions.filter(s => s.status === "live");

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Radio className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Live MUN</h2>
          <p className="text-sm text-muted-foreground">Real-time session status across all committees</p>
        </div>
      </div>

      {liveSessions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No session currently live</h3>
          <p className="text-sm text-muted-foreground">Committee sessions will appear here when they go live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liveSessions.map(session => (
            <div
              key={session.id}
              className="glass-card rounded-2xl p-6 border border-red-500/20 bg-red-500/5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge className="bg-red-500 text-white mb-3 animate-pulse gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE
                  </Badge>
                  <h3 className="text-lg font-bold">{session.title}</h3>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-foreground">Committee:</span>
                  <span>{session.committeeName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-foreground">Topic:</span>
                  <span>{session.topic}</span>
                </div>
                {session.currentSpeaker && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mic className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium text-foreground">Current Speaker:</span>
                    <span>{session.currentSpeaker}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.filter(s => s.status === "idle").length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Other Committees</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessions.filter(s => s.status === "idle").map(session => (
              <div key={session.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div>
                  <p className="font-medium text-sm">{session.committeeName}</p>
                  <p className="text-xs text-muted-foreground">Idle · {session.topic}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
