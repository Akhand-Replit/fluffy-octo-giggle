"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Settings, Ticket, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function ApplySuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") || "Your conference";

  return (
    <div className="max-w-4xl mx-auto py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Congratulations</h1>
        <h2 className="text-3xl md:text-4xl text-primary font-bold mb-16">{name} is now listed!</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Listed</h3>
              <p className="text-sm text-muted-foreground">Your conference is now listed for everybody to see!</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-slate-400 text-slate-400 flex items-center justify-center">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Customize</h3>
              <p className="text-sm text-muted-foreground">You can now start customizing your page!</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-slate-400 text-slate-400 flex items-center justify-center">
              <Ticket className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Applications</h3>
              <p className="text-sm text-muted-foreground">Allow people to register and pay in minutes!</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-slate-400 text-slate-400 flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Promotion</h3>
              <p className="text-sm text-muted-foreground">Reach your dream audience with our promo packages!</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-xl font-medium">We will now take you to your conference's dashboard to help guide you through those steps!</p>
          <Button 
            size="lg" 
            onClick={() => router.push("/dashboard/organizer")}
            className="w-full md:w-auto px-12 h-14 text-lg bg-[#0F4C68] hover:bg-[#0B3A50] text-white"
          >
            Let's go
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
