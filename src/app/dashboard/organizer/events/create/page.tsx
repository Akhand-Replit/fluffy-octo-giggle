"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEvent, EventData, Committee, TicketingTier, ScheduleItem } from "@/lib/services/eventService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Calendar, MapPin, Building, Info, DollarSign, Clock, Settings, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { ExecutiveBoardAssigner, StaffMember } from "@/components/features/organizer/ExecutiveBoardAssigner";

const SCHEDULE_TYPES = ["main", "session", "break", "social"] as const;

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [basicInfo, setBasicInfo] = useState({
    title: "", date: "", location: "", format: "offline", description: "", coverUrl: "",
  });

  const [committees, setCommittees] = useState<Committee[]>([
    { name: "", countries: [], capacity: 0, chairs: [] },
  ]);

  const [executiveBoard, setExecutiveBoard] = useState<StaffMember[]>([]);

  const [ticketingTiers, setTicketingTiers] = useState<TicketingTier[]>([
    { name: "Regular", price: 0, capacity: 100 },
  ]);

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  const [settings, setSettings] = useState({
    theme: "classic-blue",
    countryAssignmentMode: "manual" as "manual" | "ai",
    optionalModules: [] as string[]
  });

  // Auto-save debouncer
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const triggerAutoSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(() => {
      // Background save logic can be added here
      console.log("Auto-saving draft...");
    }, 30000);
    setSaveTimeout(timeout);
  };

  const handleBasicChange = (field: string, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
    triggerAutoSave();
  };

  const handleAddCommittee = () => setCommittees([...committees, { name: "", countries: [], capacity: 0, chairs: [] }]);
  const handleRemoveCommittee = (i: number) => setCommittees(committees.filter((_, idx) => idx !== i));
  const handleUpdateCommittee = (index: number, field: string, value: any) => {
    const updated = [...committees];
    if (field === "capacity") updated[index].capacity = parseInt(value) || 0;
    else if (field === "countriesStr") updated[index].countries = value.split(",").map((c: string) => c.trim()).filter(Boolean);
    else if (field === "chairsStr") updated[index].chairs = value.split(",").map((c: string) => c.trim()).filter(Boolean);
    else (updated[index] as any)[field] = value;
    setCommittees(updated);
    triggerAutoSave();
  };

  const handleAddTier = () => setTicketingTiers([...ticketingTiers, { name: "", price: 0, capacity: 0 }]);
  const handleRemoveTier = (i: number) => setTicketingTiers(ticketingTiers.filter((_, idx) => idx !== i));
  const handleUpdateTier = (index: number, field: string, value: any) => {
    const updated = [...ticketingTiers];
    if (field === "price" || field === "capacity") updated[index][field] = parseInt(value) || 0;
    else updated[index][field as "name"] = value;
    setTicketingTiers(updated);
  };

  const addScheduleItem = () =>
    setSchedule(prev => [...prev, { title: "", startTime: "", endTime: "", type: "session", location: "", description: "" }]);
  const removeScheduleItem = (i: number) => setSchedule(prev => prev.filter((_, idx) => idx !== i));
  const updateScheduleItem = (idx: number, field: keyof ScheduleItem, value: string) =>
    setSchedule(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSubmit = async (status: "draft" | "published") => {
    if (!user) return;

    // Validation
    if (status === "published") {
      if (!basicInfo.title || !basicInfo.date || !basicInfo.location) {
        alert("Please fill out all required Basic Info fields.");
        return;
      }
      if (committees.length === 0 || committees.some(c => !c.name || (c.capacity ?? 0) <= 0)) {
        alert("Please ensure all committees have a name and capacity > 0.");
        return;
      }
    }

    setLoading(true);
    try {
      const totalCap = ticketingTiers.reduce((acc, tier) => acc + tier.capacity, 0);
      const eventData: Omit<EventData, "id"> = {
        ...basicInfo,
        committees,
        organizerId: user.uid,
        status,
        ticketingTiers,
        totalCapacity: totalCap,
        schedule,
        executiveBoard,
        theme: settings.theme,
        countryAssignmentMode: settings.countryAssignmentMode,
        optionalModules: settings.optionalModules
      };
      await createEvent(eventData);
      router.push("/dashboard/organizer/events");
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
        <p className="text-muted-foreground mt-1">
          Set up a new Model UN conference, configure committees, schedule, and ticketing.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="basic" className="flex gap-2">
            <Info className="w-4 h-4 hidden sm:block" /> Basic Info
          </TabsTrigger>
          <TabsTrigger value="committees" className="flex gap-2">
            <Building className="w-4 h-4 hidden sm:block" /> Committees
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex gap-2">
            <Clock className="w-4 h-4 hidden sm:block" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex gap-2">
            <DollarSign className="w-4 h-4 hidden sm:block" /> Financials
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex gap-2">
            <Settings className="w-4 h-4 hidden sm:block" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* BASIC INFO */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General details delegates will see.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" placeholder="e.g., Global MUN 2026" value={basicInfo.title} onChange={e => handleBasicChange("title", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="date" type="date" className="pl-9" value={basicInfo.date} onChange={e => handleBasicChange("date", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <select
                    id="format"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={basicInfo.format}
                    onChange={e => handleBasicChange("format", e.target.value)}
                  >
                    <option value="offline">Offline / In-Person</option>
                    <option value="online">Online / Virtual</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="location" placeholder="Venue or Link" className="pl-9" value={basicInfo.location} onChange={e => handleBasicChange("location", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverUrl">Cover Image</Label>
                <ImageUploader
                  value={basicInfo.coverUrl}
                  onChange={(url) => handleBasicChange("coverUrl", url)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe your conference..." rows={5} value={basicInfo.description} onChange={e => handleBasicChange("description", e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setActiveTab("committees")}>Next: Committees</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* COMMITTEES */}
        <TabsContent value="committees">
          <Card>
            <CardHeader>
              <CardTitle>Committees & Staff Setup</CardTitle>
              <CardDescription>Define the executive board, committees, capacities, and available countries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <h3 className="text-lg font-medium">Executive Board</h3>
                  <p className="text-sm text-muted-foreground">Assign co-organizers, USGs, and Directors for the conference.</p>
                </div>
                <ExecutiveBoardAssigner
                  staff={executiveBoard}
                  onChange={(staff) => { setExecutiveBoard(staff); triggerAutoSave(); }}
                />
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="flex flex-col space-y-1">
                  <h3 className="text-lg font-medium">Committees</h3>
                  <p className="text-sm text-muted-foreground">Add committees and configure their specific settings.</p>
                </div>
                <div className="space-y-6">
                  {committees.map((committee, index) => (
                    <div key={index} className="p-4 border rounded-lg relative bg-card space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm">Committee {index + 1}</h4>
                        {committees.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleRemoveCommittee(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Committee Name</Label>
                          <Input placeholder="e.g., UNSC, DISEC" value={committee.name} onChange={e => handleUpdateCommittee(index, "name", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity</Label>
                          <Input type="number" min="0" value={committee.capacity || ""} onChange={e => handleUpdateCommittee(index, "capacity", e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Available Countries (comma-separated)</Label>
                        <Input placeholder="e.g., USA, UK, France, China" value={committee.countries.join(", ")} onChange={e => handleUpdateCommittee(index, "countriesStr", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Chairs / Directors (comma-separated emails)</Label>
                        <Input placeholder="e.g., chair1@example.com, chair2@example.com" value={(committee.chairs || []).join(", ")} onChange={e => handleUpdateCommittee(index, "chairsStr", e.target.value)} />
                        <p className="text-xs text-muted-foreground">Assigned users will be granted Chair permissions for this committee.</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={handleAddCommittee}>
                  <PlusCircle className="h-4 w-4" /> Add Another Committee
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab("basic")}>Back</Button>
              <Button onClick={() => setActiveTab("schedule")}>Next: Schedule</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SCHEDULE */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Conference Schedule</CardTitle>
              <CardDescription>Build the event timeline. Delegates will see this in their conference portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.length === 0 && (
                <div className="py-10 text-center border-2 border-dashed border-border/40 rounded-xl text-muted-foreground text-sm">
                  No schedule items yet. Click "Add Item" below.
                </div>
              )}
              {schedule.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border/40 bg-secondary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Item {idx + 1}</span>
                    <button onClick={() => removeScheduleItem(idx)} className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Title</Label>
                      <Input value={item.title} onChange={e => updateScheduleItem(idx, "title", e.target.value)} placeholder="e.g., Opening Ceremony" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select value={item.type} onValueChange={val => updateScheduleItem(idx, "type", val as "main" | "session" | "break" | "social")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Time</Label>
                      <Input value={item.startTime} onChange={e => updateScheduleItem(idx, "startTime", e.target.value)} placeholder="09:00 AM" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Time</Label>
                      <Input value={item.endTime} onChange={e => updateScheduleItem(idx, "endTime", e.target.value)} placeholder="10:30 AM" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Location</Label>
                      <Input value={item.location} onChange={e => updateScheduleItem(idx, "location", e.target.value)} placeholder="Main Hall" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description (optional)</Label>
                      <Input value={item.description || ""} onChange={e => updateScheduleItem(idx, "description", e.target.value)} placeholder="Brief notes..." />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2" onClick={addScheduleItem}>
                <PlusCircle className="h-4 w-4" /> Add Schedule Item
              </Button>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab("committees")}>Back</Button>
              <Button onClick={() => setActiveTab("financials")}>Next: Financials</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* FINANCIALS */}
        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle>Financials & Ticketing</CardTitle>
              <CardDescription>Define ticket tiers. Payment Gateway integration in Phase 7.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ticketingTiers.map((tier, index) => (
                <div key={index} className="p-4 border rounded-lg relative bg-card space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Tier {index + 1}</h4>
                    {ticketingTiers.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleRemoveTier(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tier Name</Label>
                      <Input placeholder="e.g., Early Bird" value={tier.name} onChange={e => handleUpdateTier(index, "name", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="number" min="0" className="pl-9" value={tier.price || ""} onChange={e => handleUpdateTier(index, "price", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Ticket Capacity</Label>
                      <Input type="number" min="0" value={tier.capacity || ""} onChange={e => handleUpdateTier(index, "capacity", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2" onClick={handleAddTier}>
                <PlusCircle className="h-4 w-4" /> Add Ticketing Tier
              </Button>
              <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <p>Payment Gateway integrations (Stripe/PayPal) are disabled. Collecting payments activates in a future update.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="ghost" onClick={() => setActiveTab("schedule")} disabled={loading}>Back</Button>
              <Button onClick={() => setActiveTab("settings")} disabled={loading}>Next: Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
              <CardDescription>Configure advanced options, themes, and automation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme Configuration</h3>
                <div className="space-y-2">
                  <Label htmlFor="theme">Event Page Theme</Label>
                  <Select value={settings.theme} onValueChange={val => setSettings(prev => ({ ...prev, theme: val as string }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic-blue">Classic Blue</SelectItem>
                      <SelectItem value="dark-diplomat">Dark Diplomat</SelectItem>
                      <SelectItem value="emerald">Emerald</SelectItem>
                      <SelectItem value="sand">Sand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">Country Assignment Mode</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="manual"
                      name="assignmentMode"
                      value="manual"
                      checked={settings.countryAssignmentMode === "manual"}
                      onChange={() => setSettings(prev => ({ ...prev, countryAssignmentMode: "manual" }))}
                      className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-600"
                    />
                    <Label htmlFor="manual" className="font-normal cursor-pointer">
                      <strong>Manual Mode</strong> - Organizer manually assigns each applicant to a country.
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="ai"
                      name="assignmentMode"
                      value="ai"
                      checked={settings.countryAssignmentMode === "ai"}
                      onChange={() => setSettings(prev => ({ ...prev, countryAssignmentMode: "ai" }))}
                      className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-600"
                    />
                    <Label htmlFor="ai" className="font-normal cursor-pointer flex items-center gap-2">
                      <strong>AI Auto-Assignment</strong> - Let MyMUN's AI assign delegates based on preferences and experience.
                      <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-medium ml-2">PRO</span>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">Optional Modules</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div>
                    <Label className="text-base font-medium">Live MUN Module</Label>
                    <p className="text-sm text-muted-foreground">Enable live crisis updates and dynamic committee interactions during the event.</p>
                  </div>
                  <Switch
                    checked={settings.optionalModules.includes("live_mun")}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({
                        ...prev,
                        optionalModules: checked
                          ? [...prev.optionalModules, "live_mun"]
                          : prev.optionalModules.filter(m => m !== "live_mun")
                      }))
                    }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="ghost" onClick={() => setActiveTab("financials")} disabled={loading}>Back</Button>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={loading}>Save as Draft</Button>
                <Button onClick={() => handleSubmit("published")} disabled={loading} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                  {loading ? "Publishing..." : "Publish Event"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
