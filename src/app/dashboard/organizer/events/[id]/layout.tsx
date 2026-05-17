"use client";

import { usePathname, useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

export default function OrganizerEventLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { id: eventId } = useParams<{ id: string }>();
  
  const TABS = [
    { label: "Overview", href: `/dashboard/organizer/events/${eventId}` },
    { label: "Applications", href: `/dashboard/organizer/events/${eventId}/applications` },
    { label: "Committees", href: `/dashboard/organizer/events/${eventId}/committees` },
    { label: "Countries", href: `/dashboard/organizer/events/${eventId}/countries` },
    { label: "Schedule", href: `/dashboard/organizer/events/${eventId}/schedule` },
    { label: "Capacity", href: `/dashboard/organizer/events/${eventId}/capacity` },
    { label: "Staff", href: `/dashboard/organizer/events/${eventId}/staff` },
    { label: "Announcements", href: `/dashboard/organizer/events/${eventId}/announcements` },
    { label: "Partners", href: `/dashboard/organizer/events/${eventId}/partners` },
    { label: "Tools", href: `/dashboard/organizer/events/${eventId}/tools` },
    { label: "Financials", href: `/dashboard/organizer/events/${eventId}/financials` }
  ];

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b border-border/50 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <Tabs value={pathname} className="w-full">
          <TabsList className="h-auto bg-transparent border-none p-0 inline-flex items-center space-x-1">
            {TABS.map(tab => {
              const isActive = pathname === tab.href;
              return (
                <TabsTrigger
                  key={tab.href}
                  value={tab.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
                  onClick={() => router.push(tab.href)}
                >
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  );
}
