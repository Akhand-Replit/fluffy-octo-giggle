import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Save, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProStatus } from '@/lib/hooks/useProStatus';
import { ProGate } from '@/components/ProGate';
import { getApplicationsByEvent, ApplicationData } from '@/lib/services/applicationService';

interface AnnouncementComposerProps {
  eventId: string;
  onSend: (announcement: any) => Promise<void>;
  onSaveDraft: (announcement: any) => Promise<void>;
}

const ROLES = [
  { id: 'delegate', label: 'Delegates' },
  { id: 'chair', label: 'Chairs & Directors' },
  { id: 'observer', label: 'Observers' },
  { id: 'faculty-advisor', label: 'Faculty Advisors' },
  { id: 'staff', label: 'Staff & Team' }
];

const ROLE_KEYWORDS: Record<string, string[]> = {
  'delegate': ['delegate'],
  'chair': ['chair', 'director', 'vice-chair'],
  'observer': ['observer'],
  'faculty-advisor': ['faculty advisor', 'faculty-advisor'],
  'staff': ['staff', 'co-organizer', 'usg'],
};

export function AnnouncementComposer({ eventId, onSend, onSaveDraft }: AnnouncementComposerProps) {
  const { profile } = useAuth();
  const { isPro } = useProStatus();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['delegate']);
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicationData[]>([]);

  useEffect(() => {
    getApplicationsByEvent(eventId).then(apps => {
      setApplications(apps.filter(a => a.status === 'approved' || a.status === 'pending'));
    });
  }, [eventId]);

  const estimatedRecipients = useMemo(() => {
    if (applications.length === 0) return selectedRoles.length * 45;
    return applications.filter(app =>
      selectedRoles.some(rid =>
        ROLE_KEYWORDS[rid]?.some(kw => app.role?.toLowerCase().includes(kw))
      )
    ).length;
  }, [applications, selectedRoles]);

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSend = async () => {
    if (!subject || !body) return;
    if (estimatedRecipients > 50 && !isPro) {
      return;
    }
    setLoading(true);
    await onSend({
      subject, body,
      audience: { roles: selectedRoles, paymentStatus },
      recipientCount: estimatedRecipients,
      status: 'queued',
      sentAt: new Date().toISOString(),
    });
    setLoading(false);
    setSubject(''); setBody('');
  };

  const handleDraft = async () => {
    if (!subject) return;
    setLoading(true);
    await onSaveDraft({
      subject, body,
      audience: { roles: selectedRoles, paymentStatus },
      recipientCount: estimatedRecipients,
      status: 'draft',
      sentAt: null,
    });
    setLoading(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>New Announcement</CardTitle>
        <CardDescription>Compose and send emails to specific participant groups.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            placeholder="e.g. Conference Schedule Update"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Email Body</Label>
          <Textarea
            id="body"
            placeholder="Type your message here..."
            className="min-h-[200px]"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" />
            Audience Filtering
          </h4>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Target Roles</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ROLES.map(role => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <label htmlFor={`role-${role.id}`} className="text-sm font-medium leading-none cursor-pointer">
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <Label className="text-xs text-muted-foreground mb-2 block">Payment Status</Label>
            <div className="flex gap-4">
              {['all', 'paid', 'unpaid'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`pay-${status}`}
                    name="paymentStatus"
                    value={status}
                    checked={paymentStatus === status}
                    onChange={() => setPaymentStatus(status)}
                    className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-600"
                  />
                  <label htmlFor={`pay-${status}`} className="text-sm cursor-pointer capitalize">{status}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-between border border-violet-100 dark:border-violet-900/30">
            <div className="text-sm">
              <span className="font-medium text-violet-900 dark:text-violet-100">Estimated Recipients: </span>
              <span className="font-bold text-violet-700 dark:text-violet-300">{estimatedRecipients}</span>
            </div>
            {estimatedRecipients > 50 && !isPro && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" /> Pro Required (&gt;50)
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={handleDraft} disabled={loading || !subject}>
          <Save className="w-4 h-4 mr-2" /> Save Draft
        </Button>
        {estimatedRecipients > 50 ? (
          <ProGate 
            feature="Bulk Emails (>50)"
            lockedFallback={
              <Button disabled className="bg-violet-600 text-white opacity-50">
                <Send className="w-4 h-4 mr-2" /> Send Now
              </Button>
            }
          >
            <Button
              onClick={handleSend}
              disabled={loading || !subject || !body}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" /> Send Now
            </Button>
          </ProGate>
        ) : (
          <Button
            onClick={handleSend}
            disabled={loading || !subject || !body}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="w-4 h-4 mr-2" /> Send Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
