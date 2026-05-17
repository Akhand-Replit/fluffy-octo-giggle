'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnnouncementComposer } from '@/components/features/organizer/AnnouncementComposer';
import { Mail, Plus, History, CheckCircle2, Clock, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAnnouncements, subscribeAnnouncements, saveAnnouncement, deleteAnnouncement, Announcement,
} from '@/lib/services/announcementService';

export default function AnnouncementsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAnnouncements(eventId, (list) => {
      setAnnouncements(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [eventId]);

  const handleSend = async (data: any) => {
    const result = await saveAnnouncement(eventId, {
      subject: data.subject,
      body: data.body,
      audience: { roles: data.audience.roles, committees: [], paymentStatus: data.audience.paymentStatus },
      status: 'queued',
      sentBy: user?.uid ?? '',
      recipientCount: data.recipientCount,
      sentAt: new Date().toISOString(),
    });
    if (result.success && result.id) {
      const fresh = await getAnnouncements(eventId);
      setAnnouncements(fresh);
    }
    setIsComposing(false);
  };

  const handleSaveDraft = async (data: any) => {
    const result = await saveAnnouncement(eventId, {
      subject: data.subject,
      body: data.body,
      audience: { roles: data.audience.roles, committees: [], paymentStatus: data.audience.paymentStatus },
      status: 'draft',
      sentBy: user?.uid ?? '',
      recipientCount: data.recipientCount,
    });
    if (result.success) {
      const fresh = await getAnnouncements(eventId);
      setAnnouncements(fresh);
    }
    setIsComposing(false);
  };

  const handleDeleteDraft = async (id: string) => {
    await deleteAnnouncement(eventId, id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communication</h1>
          <p className="text-muted-foreground mt-1">
            Send email blasts to participants and manage your announcement history.
          </p>
        </div>
        {!isComposing && (
          <Button onClick={() => setIsComposing(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </Button>
        )}
      </div>

      {isComposing ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setIsComposing(false)} className="mb-2">
            ← Back to History
          </Button>
          <AnnouncementComposer eventId={eventId} onSend={handleSend} onSaveDraft={handleSaveDraft} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Announcement History
            </CardTitle>
            <CardDescription>View previously sent emails and saved drafts.</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No announcements sent yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map(ann => (
                  <div key={ann.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{ann.subject}</h4>
                        {ann.status === 'sent' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</Badge>
                        )}
                        {ann.status === 'sending' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1 animate-spin" /> Sending...</Badge>
                        )}
                        {ann.status === 'queued' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>
                        )}
                        {ann.status === 'failed' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
                        )}
                        {ann.status === 'partial' && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partial Delivery</Badge>
                        )}
                        {ann.status === 'draft' && (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span><strong>To:</strong> {ann.audience.roles.join(', ')} ({ann.audience.paymentStatus})</span>
                        <span>•</span>
                        <span>{ann.recipientCount} recipients</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 text-sm">
                      {ann.status === 'draft' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setIsComposing(true)}>Edit</Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600" onClick={() => handleDeleteDraft(ann.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {['queued', 'sending', 'sent', 'partial', 'failed'].includes(ann.status) && (
                        <span className="text-muted-foreground text-xs flex flex-col text-right">
                          <span>{ann.sentAt ? new Date(ann.sentAt.toDate ? ann.sentAt.toDate() : ann.sentAt).toLocaleString() : '—'}</span>
                          {ann.deliveryStats && (
                             <span className="text-[10px] mt-0.5">
                               {ann.deliveryStats.sent} sent, {ann.deliveryStats.failed} failed
                             </span>
                          )}
                        </span>
                      )}
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
