'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Crown, Zap, Shield, Globe, Award } from 'lucide-react';
import { ProBadge } from '@/components/features/organizer/ProBadge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProLandingPage() {
  const { profile } = useAuth();
  const proStatus = profile?.proStatus || 'none';

  return (
    <div className="container mx-auto py-10 max-w-5xl">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <Crown className="w-16 h-16 text-violet-600 dark:text-violet-400" />
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
          MyMUN Pro
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Elevate your Model UN conference with advanced tools designed for professional organizers.
        </p>

        {proStatus !== 'none' && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            <ProBadge proStatus={proStatus} />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card className="border-2 border-transparent">
          <CardHeader>
            <CardTitle>Free Tier</CardTitle>
            <CardDescription>Everything you need to get started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {[
                'Basic Event Creation',
                'Up to 3 Committees',
                'Manual Country Assignment',
                'Basic Certificate Generation',
                'Email Support',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2 border-violet-500 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-violet-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
            Application Required
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Crown className="w-5 h-5" />
              Pro Tier
            </CardTitle>
            <CardDescription>Advanced tools for serious organizers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {[
                'Unlimited Committees',
                'AI Country Assignment',
                'Advanced Custom Themes',
                'Bulk Email Announcements (>50)',
                'Priority Support & Onboarding',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {proStatus === 'none' || proStatus === 'rejected' ? (
              <Link href="/dashboard/organizer/pro/apply" className="w-full">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20">
                  Apply for Pro Status
                </Button>
              </Link>
            ) : proStatus === 'pending' ? (
              <Button disabled className="w-full">
                Application Pending Review
              </Button>
            ) : (
              <Button disabled className="w-full bg-green-600 text-white">
                You are a Pro Member!
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-8">Pro Feature Deep Dive</h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-violet-500 mb-2" />
              <CardTitle className="text-lg">AI Auto-Assignment</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Save hours of manual work. Our AI analyzes delegate preferences, experience, and past conflicts to instantly generate optimal country assignments.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Globe className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">Custom Themes</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Brand your conference perfectly. Unlock custom hex color pickers and advanced layouts for your public-facing event page.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Award className="w-8 h-8 text-amber-500 mb-2" />
              <CardTitle className="text-lg">Live MUN Module</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Get access to the upcoming Live MUN features during your conference, including live crisis updates and dynamic committee integrations.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
