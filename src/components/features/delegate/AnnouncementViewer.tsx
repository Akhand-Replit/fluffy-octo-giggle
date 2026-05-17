"use client";

import { useEffect, useState } from "react";
import { getAnnouncements, Announcement } from "@/lib/services/announcementService";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Loader2, Megaphone, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnnouncementViewerProps {
  eventId: string;
  applicationId: string;
  onUnreadCount?: (count: number) => void;
}

function safeHtml(html: string) {
  // Basic sanitization — strip script tags
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

export function AnnouncementViewer({ eventId, applicationId, onUnreadCount }: AnnouncementViewerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastViewed, setLastViewed] = useState<Date | null>(null);

  useEffect(() => {
    // Load last viewed timestamp from localStorage
    const stored = localStorage.getItem(`announcements_viewed_${applicationId}`);
    const lastViewedDate = stored ? new Date(stored) : null;
    setLastViewed(lastViewedDate);

    getAnnouncements(eventId).then(data => {
      const visible = data.filter(a => {
        const audience = (a as any).audience;
        if (!audience) return true;
        if (typeof audience === "string") return audience === "all" || audience === "delegates";
        if (typeof audience === "object" && audience.roles) {
          return !audience.roles.length || audience.roles.includes("Delegate") || audience.roles.includes("all");
        }
        return true;
      });
      setAnnouncements(visible);

      if (onUnreadCount) {
        const unread = lastViewedDate
          ? visible.filter(a => a.createdAt?.toDate?.() > lastViewedDate).length
          : visible.length;
        onUnreadCount(unread);
      }

      // Mark as viewed now
      const now = new Date().toISOString();
      localStorage.setItem(`announcements_viewed_${applicationId}`, now);

      // Also persist to Firestore
      updateDoc(doc(db, "applications", applicationId), {
        lastAnnouncementsViewedAt: serverTimestamp()
      }).catch(() => {});

      setLoading(false);
    });
  }, [eventId, applicationId, onUnreadCount]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Megaphone className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-1">No announcements yet</h3>
        <p className="text-sm text-muted-foreground">Organizer announcements will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((ann) => {
        const createdDate = ann.createdAt?.toDate?.();
        const isUnread = lastViewed && createdDate ? createdDate > lastViewed : false;

        return (
          <div
            key={ann.id}
            className={`glass-card rounded-2xl p-6 border transition-colors ${
              isUnread ? "border-primary/30 bg-primary/5" : "border-border/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
                <h3 className="font-bold text-base">{ann.subject}</h3>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {createdDate
                  ? formatDistanceToNow(createdDate, { addSuffix: true })
                  : "Recently"
                }
              </span>
            </div>
            <div
              className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: safeHtml(ann.body || "") }}
            />
          </div>
        );
      })}
    </div>
  );
}
