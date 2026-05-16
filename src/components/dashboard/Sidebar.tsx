"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, LogOut, FileText, Award, Settings,
  Globe2, Users, Gauge, Megaphone, Handshake, CreditCard, Crown,
  IdCard, Palette, CheckSquare, ArrowLeft, CalendarDays, Landmark,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type NavItem = { name: string; href: string; icon: React.ElementType; exact?: boolean };

const standardNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { name: "My Conferences", href: "/dashboard/conferences", icon: Users },
  { name: "My Articles", href: "/dashboard/articles", icon: FileText },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Achievements", href: "/dashboard/achievements", icon: Award },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function NavItem({
  item,
  pathname,
  layoutId,
}: {
  item: NavItem;
  pathname: string;
  layoutId: string;
}) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link href={item.href} className="relative block">
      <motion.div
        className={cn(
          "flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-colors relative z-10",
          isActive
            ? "text-primary-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        <span className="text-sm">{item.name}</span>
      </motion.div>
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/25 z-0"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <h4 className="px-4 pt-5 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </h4>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}

function StandardSidebar({ pathname }: { pathname: string }) {
  const { profile } = useAuth();
  const isOrganizerOrAdmin =
    profile?.role === "organizer" || profile?.role === "admin";

  return (
    <div className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
      {standardNavItems.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          pathname={pathname}
          layoutId="active-std-sidebar"
        />
      ))}

      {isOrganizerOrAdmin && (
        <>
          <SectionLabel label="Organizer Tools" />
          <NavItem
            item={{ name: "Manage Events", href: "/dashboard/organizer/events", icon: CalendarDays }}
            pathname={pathname}
            layoutId="active-std-sidebar"
          />
        </>
      )}

      {(profile?.role === "admin" || profile?.isAdmin) && (
        <>
          <SectionLabel label="Admin Tools" />
          <NavItem
            item={{ name: "Admin Dashboard", href: "/dashboard/admin", icon: LayoutDashboard }}
            pathname={pathname}
            layoutId="active-std-sidebar"
          />
        </>
      )}
    </div>
  );
}

function OrganizerSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="flex-1 px-4 overflow-y-auto mt-4">
      <NavItem
        item={{ name: "Messages", href: "/dashboard/messages", icon: MessageSquare }}
        pathname={pathname}
        layoutId="active-org-sidebar"
      />
      <SectionLabel label="Organizer" />
      <NavItem item={{ name: "Manage Events", href: "/dashboard/organizer/events", icon: CalendarDays }} pathname={pathname} layoutId="active-org-sidebar" />
      <NavItem item={{ name: "Financials", href: "/dashboard/organizer/financials", icon: CreditCard }} pathname={pathname} layoutId="active-org-sidebar" />
      <NavItem item={{ name: "Pro Membership", href: "/dashboard/organizer/pro", icon: Crown }} pathname={pathname} layoutId="active-org-sidebar" />
      <BackLink href="/dashboard" label="Back to Dashboard" />
    </div>
  );
}

function EventSidebar({ eventId, pathname }: { eventId: string; pathname: string }) {
  const base = `/dashboard/organizer/events/${eventId}`;
  return (
    <div className="flex-1 px-4 overflow-y-auto mt-4">
      <NavItem
        item={{ name: "Messages", href: "/dashboard/messages", icon: MessageSquare }}
        pathname={pathname}
        layoutId="active-event-sidebar"
      />
      <SectionLabel label="Event" />
      <NavItem item={{ name: "Overview", href: base, icon: LayoutDashboard, exact: true }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Committees", href: `${base}/committees`, icon: Landmark }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Countries", href: `${base}/countries`, icon: Globe2 }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Staff", href: `${base}/staff`, icon: Users }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Capacity", href: `${base}/capacity`, icon: Gauge }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Announcements", href: `${base}/announcements`, icon: Megaphone }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Partners", href: `${base}/partners`, icon: Handshake }} pathname={pathname} layoutId="active-event-sidebar" />
      <SectionLabel label="Tools" />
      <NavItem item={{ name: "ID Cards", href: `${base}/tools/id-cards`, icon: IdCard }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Certificates", href: `${base}/tools/certificates`, icon: Award }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Theme", href: `${base}/tools/theme`, icon: Palette }} pathname={pathname} layoutId="active-event-sidebar" />
      <NavItem item={{ name: "Results", href: `${base}/tools/results`, icon: CheckSquare }} pathname={pathname} layoutId="active-event-sidebar" />
      <SectionLabel label="Finances" />
      <NavItem item={{ name: "Financials", href: "/dashboard/organizer/financials", icon: CreditCard }} pathname={pathname} layoutId="active-event-sidebar" />
      <BackLink href="/dashboard/organizer/events" label="Back to Events" />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isOrganizerPage = pathname.startsWith("/dashboard/organizer");
  const eventIdMatch = pathname.match(/\/dashboard\/organizer\/events\/([^/]+)/);
  const currentEventId =
    eventIdMatch && eventIdMatch[1] !== "create" ? eventIdMatch[1] : null;

  let content: React.ReactNode;
  if (isOrganizerPage && currentEventId) {
    content = <EventSidebar eventId={currentEventId} pathname={pathname} />;
  } else if (isOrganizerPage) {
    content = <OrganizerSidebar pathname={pathname} />;
  } else {
    content = <StandardSidebar pathname={pathname} />;
  }

  return (
    <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50 bg-background/60 backdrop-blur-xl border-r border-border/40">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
          M
        </div>
        <span className="font-bold text-xl tracking-tight">MUN Platform</span>
      </div>

      {content}

      <div className="p-4 mt-auto border-t border-border/40">
        <button
          onClick={logout}
          className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
