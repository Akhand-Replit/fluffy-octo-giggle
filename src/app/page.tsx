"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute top-0 -translate-x-1/2 left-1/2 w-[1000px] h-[500px] opacity-30 bg-primary blur-[120px] rounded-full pointer-events-none" />
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-48 relative">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid gap-12 lg:grid-cols-[1fr_500px] lg:gap-16 xl:grid-cols-[1fr_600px] items-center">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col justify-center space-y-8"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                    Now in Public Beta
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-7xl/none">
                    The Ultimate Platform for <span className="text-gradient">Model UN</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                    Elevate your MUN experience. Manage conferences, apply as a delegate, and track your achievements with a beautifully designed, all-in-one workspace.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Link href="/events" className={buttonVariants({ size: "lg", className: "h-12 px-8 rounded-full shadow-lg shadow-primary/25 group" })}>
                    Explore Conferences
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/signup" className={buttonVariants({ size: "lg", variant: "outline", className: "h-12 px-8 rounded-full bg-background/50 backdrop-blur-sm" })}>
                    Create Account
                  </Link>
                </div>
              </motion.div>

              {/* Floating Hero Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="mx-auto flex w-full relative lg:order-last h-[400px] md:h-[500px]"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-indigo-500/20 rounded-3xl blur-2xl transform -rotate-6"></div>
                <div className="glass-card w-full h-full rounded-3xl border border-white/10 relative overflow-hidden flex flex-col">
                  {/* Faux Window Header */}
                  <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  {/* Faux Dashboard Content */}
                  <div className="flex-1 p-6 flex flex-col gap-4">
                    <div className="w-1/3 h-6 rounded-md bg-white/10 animate-pulse"></div>
                    <div className="flex gap-4">
                      <div className="flex-1 h-24 rounded-xl bg-white/5 border border-white/5"></div>
                      <div className="flex-1 h-24 rounded-xl bg-white/5 border border-white/5"></div>
                      <div className="flex-1 h-24 rounded-xl bg-white/5 border border-white/5"></div>
                    </div>
                    <div className="flex-1 rounded-xl bg-white/5 border border-white/5 mt-4"></div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-32 relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Engineered for Excellence</h2>
                <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                  Everything you need to run or participate in a Model UN conference, housed in a meticulously crafted interface.
                </p>
              </motion.div>
            </div>
            
            <div className="mx-auto grid max-w-6xl items-center gap-8 py-8 md:grid-cols-3">
              {[
                { title: "Delegates", icon: Globe, desc: "Discover premier conferences, manage your applications, and showcase your awards in one unified profile." },
                { title: "Chairs", icon: Users, desc: "Access study guides, streamline debate moderation, and evaluate delegates with powerful, intuitive tools." },
                { title: "Organizers", icon: Shield, desc: "Deploy ticketing, automate country matrices, and orchestrate massive events with absolute confidence." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-8 rounded-3xl flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-colors"
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
