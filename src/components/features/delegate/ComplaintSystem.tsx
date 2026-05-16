"use client";

import { useState, useEffect } from "react";
import { ApplicationData } from "@/lib/services/applicationService";
import { EventData } from "@/lib/services/eventService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, Send, Clock, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";

interface ComplaintSystemProps {
  application: ApplicationData;
  event: EventData;
}

interface Complaint {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: any;
}

export function ComplaintSystem({ application, event }: ComplaintSystemProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState("general");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const q = query(
          collection(db, "complaints"),
          where("applicationId", "==", (application as any).id),
          where("userId", "==", application.userId),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
        setComplaints(fetched);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchComplaints();
  }, [application]);

  const handleSubmit = async () => {
    if (!subject || !description) return;
    setSubmitting(true);

    try {
      const newComplaint = {
        eventId: event.id,
        applicationId: (application as any).id,
        userId: application.userId,
        type,
        subject,
        description,
        status: "pending",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "complaints"), newComplaint);
      
      // Update local state optimistic
      setComplaints([{ 
        id: docRef.id, 
        ...newComplaint, 
        createdAt: { toDate: () => new Date() } 
      } as unknown as Complaint, ...complaints]);
      
      setSubject("");
      setDescription("");
      setType("general");
    } catch (error) {
      console.error("Error submitting complaint:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Section */}
      <Card className="glass-card shadow-2xl border-primary/10 lg:col-span-1 h-fit">
        <CardHeader className="bg-secondary/10 border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="w-5 h-5 text-primary" />
            New Request
          </CardTitle>
          <CardDescription>
            Submit an official request, complaint, or query.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="academic">Academic / Chair</SelectItem>
                <SelectItem value="logistics">Logistics (Food, Transport)</SelectItem>
                <SelectItem value="complaint">Code of Conduct Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input 
              placeholder="Brief subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="Provide detailed information..."
              className="min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button 
            className="w-full shadow-lg shadow-primary/20 mt-4"
            disabled={!subject || !description || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Submit Request</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card className="glass-card shadow-2xl border-primary/10 lg:col-span-2">
        <CardHeader className="bg-secondary/10 border-b border-border/50 pb-6">
          <CardTitle className="text-xl">Your Requests</CardTitle>
          <CardDescription>Track the status of your submitted requests.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-border/50">
              <CheckCircle2 className="w-12 h-12 text-primary/40 mx-auto mb-3" />
              <p className="text-lg font-medium">No requests submitted</p>
              <p className="text-sm">You haven't filed any requests or complaints yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="bg-secondary/5 border border-border/50 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                          {complaint.type}
                        </span>
                        {complaint.status === "pending" && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {complaint.status === "resolved" && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-lg">{complaint.subject}</h4>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {complaint.createdAt?.toDate ? complaint.createdAt.toDate().toLocaleDateString() : "Just now"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 bg-background/50 p-3 rounded-lg">
                    {complaint.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
