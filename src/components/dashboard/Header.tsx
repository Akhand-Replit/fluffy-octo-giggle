"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, FileText, Award } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Conferences", href: "/dashboard/conferences", icon: Users },
  { name: "My Articles", href: "/dashboard/articles", icon: FileText },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Achievements", href: "/dashboard/achievements", icon: Award },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/40 bg-background/60 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-background/90 backdrop-blur-xl border-r-border/40">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="p-6 flex items-center space-x-3 border-b border-border/40">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
                M
              </div>
              <span className="font-bold text-xl tracking-tight">MUN Platform</span>
            </div>
            <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="p-4 border-t border-border/40">
              <button
                onClick={logout}
                className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground ml-2"
            aria-hidden="true"
          />
          <Input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-10 pr-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
            placeholder="Search conferences, articles..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border/60" aria-hidden="true" />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="-m-1.5 flex items-center p-1.5 hover:bg-secondary/50 rounded-full" />}>
              <span className="sr-only">Open user menu</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                <AvatarFallback className="bg-primary/20 text-primary">{getInitials(user?.displayName)}</AvatarFallback>
              </Avatar>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-foreground" aria-hidden="true">
                  {user?.displayName || "User"}
                </span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
