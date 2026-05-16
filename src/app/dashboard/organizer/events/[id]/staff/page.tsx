'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffInviteModal } from '@/components/features/organizer/StaffInviteModal';
import { PermissionsEditor, PermissionsMap } from '@/components/features/organizer/PermissionsEditor';
import { Users, UserCheck, Shield, CheckCircle2, XCircle } from 'lucide-react';
import {
  getEventStaff, addStaffMember, updateStaffMember, removeStaffMember,
  StaffMember, DEFAULT_PERMISSIONS, ROLE_PRESETS,
} from '@/lib/services/staffService';

export default function StaffManagementPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [applyMode, setApplyMode] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    getEventStaff(eventId).then(staff => {
      setStaffList(staff);
      setLoading(false);
    });
  }, [eventId]);

  const accepted = staffList.filter(s => s.inviteStatus === 'accepted' || s.inviteStatus === 'invited');
  const applied = staffList.filter(s => s.inviteStatus === 'applied');

  const handleSendInvite = async (email: string, role: string) => {
    const member: Omit<StaffMember, 'id' | 'addedAt'> = {
      uid: '',
      name: 'Pending User',
      email,
      role: role as StaffMember['role'],
      committeeId: null,
      permissions: { ...DEFAULT_PERMISSIONS, ...(ROLE_PRESETS[role] ?? {}) },
      inviteStatus: 'invited',
    };
    const result = await addStaffMember(eventId, member);
    if (result.success && result.id) {
      setStaffList(prev => [...prev, { ...member, id: result.id }]);
    }
  };

  const handlePermissionChange = async (staffId: string, key: keyof PermissionsMap, value: boolean) => {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    const newPerms = { ...staff.permissions, [key]: value };
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, permissions: newPerms } : s));
    await updateStaffMember(eventId, staffId, { permissions: newPerms });
  };

  const handleAcceptApp = async (staffId: string) => {
    await updateStaffMember(eventId, staffId, { inviteStatus: 'accepted' });
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, inviteStatus: 'accepted' as const } : s));
  };

  const handleRejectApp = async (staffId: string) => {
    await removeStaffMember(eventId, staffId);
    setStaffList(prev => prev.filter(s => s.id !== staffId));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Executive Board, Chairs, and their specific access rights.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border p-2 rounded-lg bg-card shadow-sm">
            <Label htmlFor="apply-mode" className="text-sm cursor-pointer whitespace-nowrap">Allow Public Applications</Label>
            <Switch id="apply-mode" checked={applyMode} onCheckedChange={setApplyMode} />
          </div>
          <StaffInviteModal onSendInvite={handleSendInvite} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="current" className="gap-2">
            <Users className="w-4 h-4 hidden sm:block" /> Current & Invited
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2 relative">
            <UserCheck className="w-4 h-4 hidden sm:block" /> Applications
            {applied.length > 0 && (
              <span className="absolute top-1 right-1 sm:top-2 sm:right-2 flex h-2 w-2 rounded-full bg-violet-600" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {accepted.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-secondary/20">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No Staff Yet</h3>
              <p className="text-muted-foreground mb-4">Invite people to help manage your conference.</p>
              <StaffInviteModal onSendInvite={handleSendInvite} />
            </div>
          ) : (
            <div className="grid gap-4">
              {accepted.map(staff => (
                <div key={staff.id} className="border rounded-xl bg-card shadow-sm overflow-hidden">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 font-bold">
                        {(staff.name || staff.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{staff.name || 'Pending User'}</h4>
                          {staff.inviteStatus === 'invited' && (
                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Pending Invite</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{staff.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="capitalize">{staff.role}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedUser(expandedUser === staff.id ? null : staff.id!)}
                      >
                        {expandedUser === staff.id ? 'Hide Permissions' : 'Edit Permissions'}
                      </Button>
                    </div>
                  </div>
                  {expandedUser === staff.id && (
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <PermissionsEditor
                        role={staff.role}
                        permissions={staff.permissions}
                        onChange={(k, v) => handlePermissionChange(staff.id!, k, v)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Staff Applications</CardTitle>
              <CardDescription>
                Review people who have applied to join your staff team. Public applications are currently
                <strong className={applyMode ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                  {applyMode ? 'ENABLED' : 'DISABLED'}
                </strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applied.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending applications.</div>
              ) : (
                <div className="space-y-4">
                  {applied.map(app => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div>
                        <h4 className="font-semibold">{app.name} <span className="font-normal text-muted-foreground">({app.email})</span></h4>
                        <Badge variant="outline" className="capitalize mt-1">Applied for: {app.role}</Badge>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRejectApp(app.id!)}>
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleAcceptApp(app.id!)}>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
