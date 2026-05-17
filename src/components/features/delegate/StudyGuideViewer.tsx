"use client";

import { useEffect, useState } from "react";
import { getStudyGuide, StudyGuide } from "@/lib/services/optionalModulesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ExternalLink, Loader2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StudyGuideViewerProps {
  eventId: string;
  committeeName: string;
}

export function StudyGuideViewer({ eventId, committeeName }: StudyGuideViewerProps) {
  const [guide, setGuide] = useState<StudyGuide | null | undefined>(undefined);

  useEffect(() => {
    getStudyGuide(eventId, committeeName).then(setGuide);
  }, [eventId, committeeName]);

  if (guide === undefined) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading study guide...</span>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-muted-foreground bg-secondary/5">
        <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="font-medium text-sm">No study guide uploaded yet</p>
        <p className="text-xs mt-1">Check back later — your chair will upload it here.</p>
      </div>
    );
  }

  const uploadDate = guide.uploadedAt?.toDate?.();

  return (
    <Card className="glass-card rounded-2xl border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="w-4 h-4 text-primary" />
          Study Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{guide.fileName}</p>
            {uploadDate && (
              <p className="text-xs text-muted-foreground">
                Uploaded {formatDistanceToNow(uploadDate, { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => window.open(guide.url, "_blank")}
          >
            <ExternalLink className="w-4 h-4" /> View PDF
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => {
              const a = document.createElement("a");
              a.href = guide.url;
              a.download = guide.fileName;
              a.click();
            }}
          >
            <Download className="w-4 h-4" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
