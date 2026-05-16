"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push("/login");
      } else if (profile && profile.onboardingComplete === false) {
        router.push("/onboarding");
      }
    }
  }, [user, profile, loading, router, mounted]);

  // If loading or waiting for auth, show a less intrusive skeleton or just wait
  // We avoid returning a full screen spinner that blocks rendering if we are just navigating back
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prevent flashing content if we are about to redirect
  if (!user || (profile && profile.onboardingComplete === false)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background ambient glow - matching the new theme */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 -translate-x-1/2 left-1/2 w-[1000px] h-[500px] opacity-20 bg-primary blur-[120px] rounded-full" />
      </div>

      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
