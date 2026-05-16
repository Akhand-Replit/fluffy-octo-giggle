'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw } from 'lucide-react';
import { getApplicationsByEvent } from '@/lib/services/applicationService';

export default function IdCardsToolPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [template, setTemplate] = useState('modern');
  const [targetGroup, setTargetGroup] = useState('all');
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ delegates: 0, staff: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    getApplicationsByEvent(eventId).then(apps => {
      const approved = apps.filter(a => a.status === 'approved');
      const staffRoles = ['staff', 'co-organizer', 'usg', 'chair', 'director', 'vice-chair'];
      const staff = approved.filter(a => staffRoles.some(r => a.role?.toLowerCase().includes(r))).length;
      setCounts({ delegates: approved.length - staff, staff });
      setLoadingCounts(false);
    });
  }, [eventId]);

  const totalCount = counts.delegates + counts.staff;
  const targetCount = targetGroup === 'all' ? totalCount : targetGroup === 'delegates' ? counts.delegates : counts.staff;

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      alert(`ID card generation ready for ${targetCount} participants. ZIP download coming in Phase 7 (Firebase Functions).`);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ID Cards Generator</h1>
        <p className="text-muted-foreground mt-1">
          Select a template and bulk generate printable ID cards for all delegates and staff.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Design</label>
                <Select value={template} onValueChange={val => { if (val) setTemplate(val); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern Professional</SelectItem>
                    <SelectItem value="classic">Classic Minimal</SelectItem>
                    <SelectItem value="bold">Bold & Colorful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Group</label>
                {loadingCounts ? (
                  <Skeleton className="h-9 w-full rounded-md" />
                ) : (
                  <Select value={targetGroup} onValueChange={val => { if (val) setTargetGroup(val); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Participants ({totalCount})</SelectItem>
                      <SelectItem value="delegates">Delegates Only ({counts.delegates})</SelectItem>
                      <SelectItem value="staff">Staff Only ({counts.staff})</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white mt-4"
                onClick={handleGenerate}
                disabled={loading || loadingCounts || targetCount === 0}
              >
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {loading ? 'Generating...' : 'Generate ZIP'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>Sample rendering based on selected template.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl m-6 min-h-[400px] border border-dashed">
              <div className={`w-64 h-96 bg-white border-2 rounded-xl shadow-xl overflow-hidden flex flex-col ${
                template === 'modern' ? 'border-violet-500' :
                template === 'classic' ? 'border-slate-800' : 'border-pink-500'
              }`}>
                <div className={`h-1/3 flex items-center justify-center text-white ${
                  template === 'modern' ? 'bg-violet-600' :
                  template === 'classic' ? 'bg-slate-800' : 'bg-gradient-to-r from-pink-500 to-orange-400'
                }`}>
                  <span className="font-bold text-xl">Global MUN</span>
                </div>
                <div className="p-4 flex-1 flex flex-col items-center text-center mt-4">
                  <div className="w-20 h-20 bg-slate-200 rounded-full mb-4 overflow-hidden border-2 border-white shadow-sm -mt-12 flex items-center justify-center text-slate-400 text-xs">
                    Photo
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">Alex Johnson</h3>
                  <p className="text-violet-600 font-semibold text-sm">Delegate</p>
                  <div className="mt-4 w-full text-left text-xs space-y-2 text-slate-600">
                    <p><strong>Committee:</strong> UNSC</p>
                    <p><strong>Country:</strong> France</p>
                  </div>
                  <div className="mt-auto pt-4 border-t w-full flex justify-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center text-[8px] text-muted-foreground">QR CODE</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
