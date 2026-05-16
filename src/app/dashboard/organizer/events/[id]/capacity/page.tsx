'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CapacityCard } from '@/components/features/organizer/CapacityCard';
import { WaitlistTable, WaitlistEntry } from '@/components/features/organizer/WaitlistTable';
import { Skeleton } from '@/components/ui/skeleton';
import { getEventById, updateEvent } from '@/lib/services/eventService';
import { getApplicationsByEvent } from '@/lib/services/applicationService';
import { getWaitlistByCommittee, offerSeat } from '@/lib/services/waitlistService';

export default function CapacityManagementPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [committees, setCommittees] = useState<{ id: string; name: string; capacity: number; filledSeats: number }[]>([]);
  const [waitlist, setWaitlist] = useState<Record<string, WaitlistEntry[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [event, applications] = await Promise.all([
        getEventById(eventId),
        getApplicationsByEvent(eventId),
      ]);
      if (!event) { setLoading(false); return; }

      const approvedApps = applications.filter(a => a.status === 'approved');
      const committeeList = (event.committees ?? []).map(c => ({
        id: c.name,
        name: c.name,
        capacity: c.capacity ?? 50,
        filledSeats: approvedApps.filter(a =>
          a.assignedCommittee === c.name || a.choices?.primary?.committee === c.name
        ).length,
      }));
      setCommittees(committeeList);

      const wlMap: Record<string, WaitlistEntry[]> = {};
      await Promise.all(
        committeeList.map(async c => {
          const entries = await getWaitlistByCommittee(eventId, c.id);
          wlMap[c.id] = entries.map(e => ({
            id: e.id!,
            applicantName: e.applicantName,
            applicantEmail: e.applicantEmail,
            position: e.position,
            appliedDate: e.createdAt?.toDate?.()?.toLocaleDateString() ?? '—',
            status: e.status as WaitlistEntry['status'],
          }));
        })
      );
      setWaitlist(wlMap);
      setLoading(false);
    }
    load();
  }, [eventId]);

  const handleAddSeats = async (committeeId: string, additionalSeats: number) => {
    const event = await getEventById(eventId);
    if (!event) return;
    const updatedCommittees = (event.committees ?? []).map(c =>
      c.name === committeeId ? { ...c, capacity: (c.capacity ?? 50) + additionalSeats } : c
    );
    await updateEvent(eventId, { committees: updatedCommittees });
    setCommittees(prev => prev.map(c =>
      c.id === committeeId ? { ...c, capacity: c.capacity + additionalSeats } : c
    ));
  };

  const handleOfferSeat = async (entryId: string) => {
    await offerSeat(eventId, entryId);
    setWaitlist(prev => {
      const updated = { ...prev };
      for (const cid in updated) {
        updated[cid] = updated[cid].map(e => e.id === entryId ? { ...e, status: 'offered' as const } : e);
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Capacity & Waitlist Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor committee fill rates, expand capacities, and manage waitlisted delegates.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b pb-2">Committee Overview</h2>
        {committees.length === 0 ? (
          <p className="text-muted-foreground text-sm">No committees configured for this event.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {committees.map(committee => (
              <CapacityCard
                key={committee.id}
                committeeId={committee.id}
                name={committee.name}
                capacity={committee.capacity}
                filledSeats={committee.filledSeats}
                onAddSeats={handleAddSeats}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 pt-6">
        <h2 className="text-xl font-semibold border-b pb-2">Waitlist Queues</h2>
        {committees.map(committee => {
          const committeeWaitlist = waitlist[committee.id] ?? [];
          if (committeeWaitlist.length === 0 && committee.filledSeats < committee.capacity) return null;
          return (
            <WaitlistTable
              key={`wl-${committee.id}`}
              committeeName={committee.name}
              entries={committeeWaitlist}
              onOfferSeat={handleOfferSeat}
            />
          );
        })}
      </div>
    </div>
  );
}
