"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EventData } from "@/lib/services/eventService";
import { ApplicationData } from "@/lib/services/applicationService";
import { savePositionPaperGrade, getDelegateMarking, addPaperComment, subscribeToPaperComments, PaperComment } from "@/lib/services/markingService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Save, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PositionPaperViewerProps {
  application: ApplicationData;
  event: EventData;
  committeeName: string;
  onClose: () => void;
}

export function PositionPaperViewer({ application, event, committeeName, onClose }: PositionPaperViewerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"review" | "approved" | "revision" | "flagged">("review");
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<PaperComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const paperUrl = (application as any).positionPaperUrl;

  useEffect(() => {
    async function loadData() {
      if (!application.userId) return;
      const marking = await getDelegateMarking((application as any).id, application.userId);
      if (marking) {
        setMarkingId(marking.id || null);
        setScore(marking.positionPaperScore || 0);
        setFeedback(marking.feedback || "");
        if (marking.paperStatus) setStatus(marking.paperStatus);
      }
      setLoading(false);
    }
    loadData();
  }, [application]);

  useEffect(() => {
    let unsubscribe: () => void;
    if (markingId) {
      unsubscribe = subscribeToPaperComments(markingId, (loadedComments) => {
        setComments(loadedComments);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [markingId]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await savePositionPaperGrade(
      (application as any).id,
      application.userId,
      event.id,
      committeeName,
      score,
      feedback,
      status,
      user.uid
    );
    // After save, try to reload markingId if we didn't have one
    if (!markingId) {
      const marking = await getDelegateMarking((application as any).id, application.userId);
      if (marking && marking.id) setMarkingId(marking.id);
    }
    setSaving(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !markingId) return;
    setSendingComment(true);
    await addPaperComment(markingId, {
      text: newComment.trim(),
      authorId: user.uid,
      authorName: user.displayName || "Chair"
    });
    setNewComment("");
    setSendingComment(false);
  };

  const statusColors = {
    review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    revision: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    flagged: "bg-red-500/10 text-red-500 border-red-500/20"
  };

  return (
    <div className="flex flex-col lg:flex-row h-[85vh] w-full bg-background rounded-xl overflow-hidden shadow-2xl border border-border">
      {/* Left side: PDF Viewer */}
      <div className="w-full lg:w-[70%] h-full bg-secondary/5 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border bg-secondary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusColors[status]}>
              {status.toUpperCase()}
            </Badge>
            <span className="text-sm font-medium">Position Paper: {application.assignedCountry || application.choices.primary.country}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.open(paperUrl, "_blank")}>
            Open in new tab
          </Button>
        </div>
        <div className="flex-1 overflow-hidden p-2">
          {paperUrl ? (
            <iframe 
              src={`${paperUrl}#toolbar=0`} 
              className="w-full h-full rounded-lg bg-white" 
              title="Position Paper"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No paper submitted
            </div>
          )}
        </div>
      </div>

      {/* Right side: Grading Sidebar */}
      <div className="w-full lg:w-[30%] h-full overflow-y-auto flex flex-col bg-card">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="p-4 space-y-6">
              {/* Delegate Info */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{application.assignedCountry || application.choices.primary.country}</h3>
                <p className="text-sm text-muted-foreground">{application.applicantName} • {committeeName}</p>
              </div>

              {/* Grading Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="revision">Needs Revision</SelectItem>
                      <SelectItem value="flagged">Plagiarism Concern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Position Paper Score</Label>
                  <Input 
                    type="number" 
                    value={score} 
                    onChange={e => setScore(Number(e.target.value) || 0)} 
                    placeholder="e.g. 85"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Feedback to Delegate</Label>
                  <Textarea 
                    placeholder="This will be visible to the delegate..." 
                    className="min-h-[100px] resize-y"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />
                </div>

                <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Grade
                </Button>
              </div>

              {/* Comments Thread (Chair only) */}
              <div className="pt-4 border-t border-border/50">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" /> Internal Chair Notes
                </h4>
                
                {!markingId ? (
                  <p className="text-xs text-muted-foreground italic">Save the grade first to enable comments.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No notes yet</p>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="bg-secondary/10 p-3 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{comment.authorName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{comment.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add a private note..." 
                        className="text-xs h-8"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAddComment()}
                      />
                      <Button size="sm" className="h-8 w-8 p-0" onClick={handleAddComment} disabled={sendingComment || !newComment.trim()}>
                        {sendingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
