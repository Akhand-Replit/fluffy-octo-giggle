"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

export function StatCard({ title, value, description, icon: Icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-2xl p-6 flex flex-col hover:border-primary/30 transition-colors group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}
