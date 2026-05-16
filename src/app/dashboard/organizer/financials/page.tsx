'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrganizerEvents, EventData, TicketingTier } from '@/lib/services/eventService';
import { getApplicationsByEvent, ApplicationData } from '@/lib/services/applicationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Clock, AlertCircle, CheckCircle2, Wallet, CreditCard, ArrowUpRight, CalendarDays } from 'lucide-react';
import { TierStatusCard } from '@/components/features/organizer/TierStatusCard';

interface PaymentRecord {
  id: string;
  applicantName: string;
  tier: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
  date: string;
}

export default function FinancialsDashboard() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isPayoutLoading, setIsPayoutLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getOrganizerEvents(user.uid).then(evs => {
      setEvents(evs);
      if (evs.length > 0) setSelectedEventId(evs[0].id);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedEventId) { setSelectedEvent(null); setApplications([]); return; }
    const ev = events.find(e => e.id === selectedEventId) ?? null;
    setSelectedEvent(ev);
    getApplicationsByEvent(selectedEventId).then(setApplications);
  }, [selectedEventId, events]);

  const tiers: TicketingTier[] = selectedEvent?.ticketingTiers ?? [];

  // Derive payment records from approved applications + tier matching
  const payments: PaymentRecord[] = applications
    .filter(a => a.status === 'approved' || a.status === 'pending')
    .map((a, i) => {
      const tier = tiers.length > 0 ? tiers[0] : null;
      return {
        id: (a as any).id ?? `app-${i}`,
        applicantName: a.applicantName ?? a.userId,
        tier: tier?.name ?? 'Standard',
        amount: tier?.price ?? 0,
        status: a.status === 'approved' ? 'paid' : 'pending',
        date: a.createdAt?.toDate?.()?.toLocaleDateString() ?? '—',
      };
    });

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalCapacity = tiers.reduce((s, t) => s + t.capacity, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  // Stripe stays mock per project plan (Phase 7)
  const walletBalance = totalRevenue;
  const stripeConnected = !!(profile as any)?.stripeAccountId;

  const handleRequestPayout = () => {
    setIsPayoutLoading(true);
    setTimeout(() => {
      alert('Stripe payout: coming in Phase 7. Balance recorded in Firestore.');
      setIsPayoutLoading(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-6xl space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financials & Ticketing</h1>
          <p className="text-muted-foreground mt-1">Track revenue, tickets, and payouts per event.</p>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={selectedEventId} onValueChange={v => { if (v) setSelectedEventId(v); }}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(ev => (
                  <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center text-muted-foreground">
            No events found. Create an event first to see financials.
          </CardContent>
        </Card>
      ) : !selectedEvent ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center text-muted-foreground">Select an event above.</CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-violet-100 flex items-center justify-between">
                  Total Revenue <DollarSign className="w-4 h-4 text-violet-200" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${walletBalance.toLocaleString()}</div>
                <p className="text-xs text-violet-200 mt-1">From approved applications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Tickets Sold <CreditCard className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {payments.filter(p => p.status === 'paid').length}
                  <span className="text-sm text-muted-foreground font-normal"> / {totalCapacity || '∞'}</span>
                </div>
                {totalCapacity > 0 && (
                  <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${Math.min((payments.filter(p => p.status === 'paid').length / totalCapacity) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Pending <Clock className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview & Tiers</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="wallet">Wallet & Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <h2 className="text-xl font-semibold">Ticketing Tiers</h2>
              {tiers.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center text-muted-foreground text-sm">
                    No ticketing tiers configured for this event.
                    Edit the event to add tiers.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {tiers.map((tier, i) => (
                    <TierStatusCard
                      key={i}
                      name={tier.name}
                      price={tier.price}
                      capacity={tier.capacity}
                      sold={(tier as any).sold ?? 0}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                  <CardDescription>Applications with payment status for {selectedEvent.title}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No payments yet.</p>
                  ) : (
                    <div className="border rounded-md overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/50 border-b">
                          <tr>
                            <th className="text-left font-medium p-3">Applicant</th>
                            <th className="text-left font-medium p-3">Tier</th>
                            <th className="text-right font-medium p-3">Amount</th>
                            <th className="text-center font-medium p-3">Date</th>
                            <th className="text-right font-medium p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment, i) => (
                            <tr key={payment.id} className={i !== payments.length - 1 ? 'border-b' : ''}>
                              <td className="p-3 font-medium">{payment.applicantName}</td>
                              <td className="p-3 text-muted-foreground">{payment.tier}</td>
                              <td className="p-3 text-right">${payment.amount}</td>
                              <td className="p-3 text-center text-muted-foreground">{payment.date}</td>
                              <td className="p-3 text-right">
                                {payment.status === 'paid' && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                                  </Badge>
                                )}
                                {payment.status === 'pending' && (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    <Clock className="w-3 h-3 mr-1" /> Pending
                                  </Badge>
                                )}
                                {payment.status === 'refunded' && (
                                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Refunded
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-6 h-6 text-violet-600" />
                      <CardTitle>Organizer Wallet</CardTitle>
                    </div>
                    <CardDescription>Stripe Connect — Phase 7 integration.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 bg-secondary/10 rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-medium text-muted-foreground mb-1">Derived Balance</span>
                      <span className="text-4xl font-bold">${walletBalance.toLocaleString()}</span>
                    </div>
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        onClick={handleRequestPayout}
                        disabled={isPayoutLoading || walletBalance <= 0}
                      >
                        {isPayoutLoading ? 'Processing…' : 'Request Payout'}
                      </Button>
                      {stripeConnected ? (
                        <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> Stripe connected
                        </p>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => alert('Stripe Connect — Phase 7')}>
                          Connect Stripe Account
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                    <CardDescription>Past transfers will appear here once Stripe is connected.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                      <ArrowUpRight className="w-8 h-8 opacity-20" />
                      No payouts yet.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
