"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEventById, updateEvent, EventData, Committee } from "@/lib/services/eventService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Users, Globe2, Plus, Edit2, Trash2, Save, Loader2, AlertTriangle } from "lucide-react";

export default function CommitteeManagementPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    countries: "",
    chairs: "",
  });

  useEffect(() => {
    async function loadData() {
      if (!user || !eventId) return;
      const eventData = await getEventById(eventId);
      
      if (!eventData || eventData.organizerId !== user.uid) {
        router.push("/dashboard/organizer/events");
        return;
      }
      
      setEvent(eventData);
      setCommittees(eventData.committees || []);
      setLoading(false);
    }
    loadData();
  }, [user, eventId, router]);

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      const committee = committees[index];
      setFormData({
        name: committee.name,
        capacity: committee.capacity?.toString() || "",
        countries: committee.countries?.join(", ") || "",
        chairs: committee.chairs?.join(", ") || "",
      });
      setEditingIndex(index);
    } else {
      setFormData({ name: "", capacity: "", countries: "", chairs: "" });
      setEditingIndex(null);
    }
    setIsDialogOpen(true);
  };

  const handleSaveCommittee = async () => {
    if (!formData.name.trim()) return;

    const newCommittee: Committee = {
      name: formData.name.trim(),
      capacity: parseInt(formData.capacity) || 0,
      countries: formData.countries.split(",").map(c => c.trim()).filter(Boolean),
      chairs: formData.chairs.split(",").map(c => c.trim()).filter(Boolean),
    };

    let updatedCommittees = [...committees];
    if (editingIndex !== null) {
      updatedCommittees[editingIndex] = newCommittee;
    } else {
      updatedCommittees.push(newCommittee);
    }

    setSaving(true);
    try {
      await updateEvent(eventId, { committees: updatedCommittees });
      setCommittees(updatedCommittees);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving committee:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCommittee = async () => {
    if (editingIndex === null) return;
    
    const updatedCommittees = committees.filter((_, i) => i !== editingIndex);
    
    setSaving(true);
    try {
      await updateEvent(eventId, { committees: updatedCommittees });
      setCommittees(updatedCommittees);
      setIsDeleteDialogOpen(false);
      setEditingIndex(null);
    } catch (error) {
      console.error("Error deleting committee:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-20">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Committees</h1>
          <p className="text-muted-foreground mt-1">
            Manage the committees, capacities, and assigned countries for your event.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog(null)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Committee
        </Button>
      </div>

      {committees.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <Landmark className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Committees Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first committee to start organizing your conference structure and allocating delegates.
            </p>
            <Button onClick={() => handleOpenDialog(null)}>Create Committee</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees.map((committee, idx) => (
            <Card key={idx} className="glass-card hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{committee.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleOpenDialog(idx)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setEditingIndex(idx); setIsDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/10 p-3 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Capacity</span>
                    </div>
                    <p className="text-lg font-semibold">{committee.capacity || "N/A"}</p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Globe2 className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Countries</span>
                    </div>
                    <p className="text-lg font-semibold">{committee.countries?.length || 0}</p>
                  </div>
                </div>

                {committee.chairs && committee.chairs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chairs</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {committee.chairs.map((chair, i) => (
                        <Badge key={i} variant="outline" className="bg-primary/5">{chair}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Committee" : "Create Committee"}</DialogTitle>
            <DialogDescription>
              Configure the details, capacity, and available countries for this committee.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Committee Name</Label>
              <Input 
                placeholder="e.g., UNSC, DISEC, WHO" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Total Capacity</Label>
              <Input 
                type="number" 
                placeholder="e.g., 50" 
                value={formData.capacity} 
                onChange={e => setFormData({...formData, capacity: e.target.value})} 
              />
              <p className="text-xs text-muted-foreground">Maximum number of delegates this committee can hold.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Countries Matrix (Comma Separated)</Label>
              <Textarea 
                placeholder="USA, UK, France, China, Russia..." 
                className="min-h-[100px]"
                value={formData.countries} 
                onChange={e => setFormData({...formData, countries: e.target.value})} 
              />
              <p className="text-xs text-muted-foreground">List all available countries for this committee, separated by commas.</p>
            </div>

            <div className="space-y-2">
              <Label>Chairs (Comma Separated)</Label>
              <Input 
                placeholder="John Doe, Jane Smith" 
                value={formData.chairs} 
                onChange={e => setFormData({...formData, chairs: e.target.value})} 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveCommittee} disabled={saving || !formData.name.trim()} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Committee
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the <strong>{editingIndex !== null ? committees[editingIndex]?.name : ""}</strong> committee?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will remove the committee from the event. Any delegates assigned to this committee might need to be reassigned. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCommittee} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
