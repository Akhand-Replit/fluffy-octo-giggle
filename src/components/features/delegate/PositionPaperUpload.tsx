"use client";

import { useState } from "react";
import { ApplicationData } from "@/lib/services/applicationService";
import { EventData } from "@/lib/services/eventService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, CheckCircle2, Loader2, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { storage, db } from "@/lib/firebase/client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { getDelegateMarking } from "@/lib/services/markingService";
import { useEffect } from "react";

interface PositionPaperUploadProps {
  application: ApplicationData;
  event: EventData;
}

export function PositionPaperUpload({ application, event }: PositionPaperUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<any>(null);

  const existingPaperUrl = (application as any).positionPaperUrl;

  useEffect(() => {
    async function loadMarking() {
      if (existingPaperUrl) {
        const m = await getDelegateMarking((application as any).id, application.userId);
        setMarking(m);
      }
    }
    loadMarking();
  }, [application, existingPaperUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === "application/pdf" || selected.type.includes("word")) {
        setFile(selected);
        setError(null);
      } else {
        setError("Please upload a PDF or Word document.");
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const fileRef = ref(storage, `position-papers/${event.id}/${(application as any).id}/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(prog);
      },
      (error) => {
        console.error("Upload failed:", error);
        setError("Upload failed. Please try again.");
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Update application in Firestore
        try {
          const appRef = doc(db, "applications", (application as any).id);
          await updateDoc(appRef, {
            positionPaperUrl: downloadURL
          });
          setFile(null);
          setUploading(false);
          // Normally we'd invalidate a query here, but since we are simple we can just refresh
          window.location.reload();
        } catch (err) {
          setError("Failed to save to database.");
          setUploading(false);
        }
      }
    );
  };

  return (
    <Card className="glass-card shadow-2xl border-primary/10 overflow-hidden relative">
      <CardHeader className="bg-secondary/10 border-b border-border/50 pb-6">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <FileText className="w-6 h-6 text-primary" />
          Position Paper
        </CardTitle>
        <CardDescription className="text-base">
          Upload your position paper for your assigned committee and country.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-8">
        {existingPaperUrl ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            
            {marking?.paperStatus === "approved" ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-semibold text-green-600">Paper Approved</h3>
                  <p className="text-sm text-muted-foreground">Your position paper has been reviewed and approved by the Chairs.</p>
                </div>
                {marking?.feedback && (
                  <div className="bg-secondary/10 p-4 rounded-xl text-sm border border-border/50 max-w-md w-full text-center">
                    <p className="font-semibold mb-1">Chair Feedback:</p>
                    <p className="text-muted-foreground italic">"{marking.feedback}"</p>
                  </div>
                )}
              </div>
            ) : marking?.paperStatus === "revision" ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-semibold text-yellow-600">Revision Requested</h3>
                  <p className="text-sm text-muted-foreground">The Chairs have requested changes to your position paper.</p>
                </div>
                {marking?.feedback && (
                  <div className="bg-yellow-500/5 p-4 rounded-xl text-sm border border-yellow-500/20 max-w-md w-full text-center text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold mb-1">Chair Feedback:</p>
                    <p className="italic">"{marking.feedback}"</p>
                  </div>
                )}
              </div>
            ) : marking?.paperStatus === "flagged" ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-semibold text-red-500">Plagiarism Concern</h3>
                  <p className="text-sm text-muted-foreground">Please review your paper and ensure all sources are properly cited.</p>
                </div>
                {marking?.feedback && (
                  <div className="bg-red-500/5 p-4 rounded-xl text-sm border border-red-500/20 max-w-md w-full text-center text-red-800 dark:text-red-200">
                    <p className="font-semibold mb-1">Chair Feedback:</p>
                    <p className="italic">"{marking.feedback}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-blue-500" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-semibold">Under Review</h3>
                  <p className="text-sm text-muted-foreground">Your position paper is currently being reviewed by the Chairs.</p>
                </div>
              </div>
            )}

            <Button variant="outline" className="gap-2" onClick={() => window.open(existingPaperUrl, "_blank")}>
              View Document <ExternalLink className="w-4 h-4" />
            </Button>
            
            <div className="w-full h-px bg-border my-6" />
            
            <div className="w-full space-y-4">
              <p className="text-sm text-center text-muted-foreground">Want to update your paper?</p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Input 
                  id="file-upload" 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="max-w-xs file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-medium hover:file:bg-primary/90 transition-all cursor-pointer"
                />
                <Button onClick={handleUpload} disabled={!file || uploading} className="w-full sm:w-auto">
                  {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Upload New'}
                </Button>
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-8">
            <div className="w-full max-w-md border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center bg-secondary/5 transition-colors hover:bg-secondary/10">
              <UploadCloud className="w-16 h-16 text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="text-center cursor-pointer space-y-2">
                <span className="text-lg font-medium text-primary hover:underline">Click to browse</span>
                <p className="text-sm text-muted-foreground">or drag and drop your file here</p>
                <p className="text-xs text-muted-foreground mt-2">Supports PDF, DOC, DOCX (Max 5MB)</p>
              </Label>
              <Input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="w-full max-w-md bg-secondary/20 p-4 rounded-lg flex items-center justify-between border border-primary/20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{file.name}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            {uploading && (
              <div className="w-full max-w-md space-y-2">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}% Uploaded</p>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full max-w-md shadow-lg shadow-primary/20"
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><UploadCloud className="w-5 h-5 mr-2" /> Submit Position Paper</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
