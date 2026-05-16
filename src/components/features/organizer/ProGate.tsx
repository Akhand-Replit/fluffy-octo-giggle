'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import Link from 'next/link';

interface ProGateProps {
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode;
}

export function ProGate({ children, featureName, fallback }: ProGateProps) {
  const { profile } = useAuth();
  
  const proStatus = profile?.proStatus || 'none';
  const isPro = proStatus === 'active';

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-dashed bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <CardTitle className="text-xl">{featureName} is a Pro Feature</CardTitle>
        <CardDescription>
          Upgrade your organizer account to Pro to unlock advanced tools and capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pt-4">
        <Link href="/dashboard/organizer/pro">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md">
            <Crown className="w-4 h-4 mr-2" />
            Learn about Pro
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
