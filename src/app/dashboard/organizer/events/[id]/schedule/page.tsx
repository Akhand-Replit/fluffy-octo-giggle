"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, updateEvent, EventData, ScheduleItem } from "@/lib/services/eventService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, CalendarDays, Save, Clock } from "lucide-react";


export default function SchedulePage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user || !eventId) return;
      const eventData = await getEventById(eventId);
      if (eventData) {
        setEvent(eventData);
        setSchedule(eventData.schedule || []);
      }
      setLoading(false);
    }
    loadData();
  }, [user, eventId]);

  const handleAddItem = () => {
    setSchedule([...schedule, { title: "", startTime: "", endTime: "", location: "", type: "session" }]);
  };

  const handleRemoveItem = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof ScheduleItem, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      await updateEvent(eventId, { schedule });
      alert("Schedule updated successfully");
    } catch (err) {
      alert("Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" /> Schedule Builder
          </h2>
          <p className="text-muted-foreground mt-1">Plan the itinerary and sessions for {event?.title}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleAddItem} className="gap-2">
            <Plus className="w-4 h-4" /> Add Session
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6">
          {schedule.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-border/50">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No schedule items added yet.</p>
              <Button variant="link" onClick={handleAddItem}>Click here to add the first session</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {schedule.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border border-border/50 rounded-xl bg-secondary/5 relative group">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Session Title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => handleChange(index, "title", e.target.value)}
                        placeholder="e.g. Opening Ceremony"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={item.type} onValueChange={(v) => handleChange(index, "type", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">Main Event</SelectItem>
                          <SelectItem value="session">Committee Session</SelectItem>
                          <SelectItem value="break">Break / Lunch</SelectItem>
                          <SelectItem value="social">Social Event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={item.startTime}
                        onChange={(e) => handleChange(index, "startTime", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="datetime-local"
                        value={item.endTime}
                        onChange={(e) => handleChange(index, "endTime", e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:mt-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
