"use client";

import { motion } from "framer-motion";

export default function AchievementsPage() {
  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground mt-1">
          View your Model UN awards and certificates.
        </p>
      </motion.div>

      <div className="py-20 text-center text-muted-foreground glass-card rounded-2xl border-dashed flex flex-col items-center">
        <p className="text-xl font-medium mb-2">Coming Soon</p>
        <p className="max-w-md mx-auto">Your achievements and certificates will appear here once you complete conferences.</p>
      </div>
    </div>
  );
}
