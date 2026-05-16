"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes that should NOT show the global Navbar and Footer
  const isDashboard = pathname?.startsWith("/dashboard");
  const isOnboarding = pathname?.startsWith("/onboarding");
  const isAuth = pathname === "/login" || pathname === "/signup";
  
  // We want to hide the global navbar/footer on dashboard and onboarding
  // Often login/signup have their own minimal layout or the global one.
  // Based on the user's screenshot, the global navbar is overlapping the dashboard.
  const hideGlobalLayout = isDashboard || isOnboarding;

  return (
    <>
      {!hideGlobalLayout && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!hideGlobalLayout && <Footer />}
    </>
  );
}
