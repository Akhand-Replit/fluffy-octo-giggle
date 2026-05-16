'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateUserProfile } from '@/lib/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, Crown } from 'lucide-react';
import Link from 'next/link';

export default function ProApplicationPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      orgName: formData.get('orgName') as string,
      website: formData.get('website') as string,
      eventsPerYear: formData.get('eventsPerYear') as string,
      motivation: formData.get('motivation') as string,
      userId: user.uid,
      status: 'pending',
      appliedAt: serverTimestamp(),
    };

    try {
      // 1. Create proApplication doc
      await setDoc(doc(db, 'proApplications', user.uid), data);

      // 2. Update user profile proStatus
      await updateUserProfile(user.uid, {
        proStatus: 'pending',
        proAppliedAt: serverTimestamp(),
      });

      // 3. Redirect back to pro page
      router.push('/dashboard/organizer/pro');
      router.refresh();
    } catch (err: any) {
      console.error('Error submitting pro application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.proStatus === 'active' || profile?.proStatus === 'pending') {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Application Already Submitted</h2>
        <p className="text-muted-foreground mb-8">You already have an active or pending Pro status.</p>
        <Link href="/dashboard/organizer/pro">
          <Button variant="outline">Return to Pro Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Link href="/dashboard/organizer/pro" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Pro Details
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-violet-600" />
            <CardTitle className="text-2xl">Apply for MyMUN Pro</CardTitle>
          </div>
          <CardDescription>
            Tell us a bit about your organization so we can verify your account for Pro features.
            Approval usually takes 1-2 business days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-6 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          <form id="pro-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization / Society Name <span className="text-red-500">*</span></Label>
              <Input id="orgName" name="orgName" required placeholder="e.g. Global Model UN Society" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website or Social Media Link</Label>
              <Input id="website" name="website" type="url" placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventsPerYear">Estimated Conferences Per Year</Label>
              <select 
                id="eventsPerYear" 
                name="eventsPerYear"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="1">1</option>
                <option value="2-3">2-3</option>
                <option value="4+">4 or more</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">Why do you need Pro features? <span className="text-red-500">*</span></Label>
              <Textarea 
                id="motivation" 
                name="motivation" 
                required 
                placeholder="Briefly explain your conference needs and how Pro features like AI Country Assignment will help..."
                className="min-h-[100px]"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button 
            type="submit" 
            form="pro-form" 
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Application
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
