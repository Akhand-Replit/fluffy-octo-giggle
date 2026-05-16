"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { Avatar as RealAvatar, AvatarFallback as RealAvatarFallback, AvatarImage as RealAvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
              M
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">MUN Platform</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/events" className="transition-colors hover:text-primary text-foreground/70">
              Events
            </Link>
            <Link href="/articles" className="transition-colors hover:text-primary text-foreground/70">
              Articles
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "rounded-full px-6" })}>
                Dashboard
              </Link>
              <RealAvatar className="h-9 w-9 border border-primary/20">
                <RealAvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                <RealAvatarFallback className="bg-primary/10 text-primary">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </RealAvatarFallback>
              </RealAvatar>
            </div>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", className: "text-foreground/80 hover:text-foreground" })}>
                Login
              </Link>
              <Link href="/signup" className={buttonVariants({ className: "rounded-full shadow-md shadow-primary/20 px-6" })}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
