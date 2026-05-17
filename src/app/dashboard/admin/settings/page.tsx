"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getSystemSettings, updateSystemSettings, SystemSettings } from "@/lib/services/systemSettingsService";
import { logAudit } from "@/lib/services/auditService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Settings, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function SystemSettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  
  useEffect(() => {
    if (authLoading) return;
    if (!profile || (profile.role !== "App Admin" && !(profile as any).isAdmin)) {
      router.push("/dashboard");
      return;
    }
    
    async function load() {
      try {
        const data = await getSystemSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile, authLoading, router]);

  const handleSave = async (tabName: string) => {
    if (!settings || !profile) return;
    setSaving(true);
    setSaveStatus("saving");
    try {
      await updateSystemSettings(settings);
      await logAudit({
        actorUid: profile.uid,
        actorEmail: profile.email || "",
        actorRole: profile.role,
        action: "system_settings_updated",
        targetType: "systemSettings",
        targetId: "global",
        targetName: `${tabName} Settings`,
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveStatus("idle");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    setSaveStatus("idle");
  };

  if (loading || authLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global platform behavior.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saved" && <span className="text-sm text-green-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Saved</span>}
          {saveStatus === "saving" && <span className="text-sm text-muted-foreground flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin"/> Saving...</span>}
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-background/50 backdrop-blur-md border border-border/50 p-1 rounded-2xl h-auto mb-6">
          <TabsTrigger value="general" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">General</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pricing</TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Maintenance</TabsTrigger>
          <TabsTrigger value="legal" className="rounded-xl py-2 px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>General Configuration</CardTitle>
              <CardDescription>Basic settings for the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input 
                  value={settings.supportEmail} 
                  onChange={(e) => updateSetting("supportEmail", e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Event Theme</Label>
                <Select value={settings.defaultEventTheme} onValueChange={(val) => updateSetting("defaultEventTheme", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border p-4 rounded-xl">
                <div className="space-y-0.5">
                  <Label className="text-base">Allow Guest Article Comments</Label>
                  <p className="text-sm text-muted-foreground">Unregistered users can comment on public articles.</p>
                </div>
                <Switch 
                  checked={settings.allowGuestArticleComments}
                  onCheckedChange={(val) => updateSetting("allowGuestArticleComments", val)}
                />
              </div>
              <Button onClick={() => handleSave("General")} disabled={saving}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-0 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Pricing & Limits</CardTitle>
              <CardDescription>Configure platform fees and hard limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Platform Fee Percentage ({settings.platformFeePercent}%)</Label>
                <input 
                  type="range" 
                  min="0" max="15" step="0.5"
                  value={settings.platformFeePercent}
                  onChange={(e) => updateSetting("platformFeePercent", parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Event Capacity</Label>
                <Input 
                  type="number"
                  value={settings.maxEventCapacity}
                  onChange={(e) => updateSetting("maxEventCapacity", parseInt(e.target.value))}
                  min={10} max={100000}
                />
                <p className="text-xs text-muted-foreground">Absolute maximum capacity for any single event.</p>
              </div>
              <Button onClick={() => handleSave("Pricing")} disabled={saving}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-0 space-y-6">
          <Card className="glass-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Maintenance Mode</CardTitle>
              <CardDescription>Affects all non-admin users immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border border-destructive/20 bg-destructive/5 p-4 rounded-xl">
                <div className="space-y-0.5">
                  <Label className="text-base text-destructive font-semibold">Enable Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Locks out regular users and displays the maintenance message.</p>
                </div>
                <Switch 
                  checked={settings.maintenanceMode}
                  onCheckedChange={(val) => updateSetting("maintenanceMode", val)}
                />
              </div>
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Textarea 
                  value={settings.maintenanceMessage}
                  onChange={(e) => updateSetting("maintenanceMessage", e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={() => handleSave("Maintenance")} disabled={saving} variant={settings.maintenanceMode ? "destructive" : "default"}>
                Save Maintenance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="mt-0 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
              <CardDescription>Update Terms of Service and Privacy Policy markdown. (For demo purposes)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">Legal content updates trigger timestamp changes automatically upon save.</p>
              <Button onClick={() => handleSave("Legal")} disabled={saving}>Update Legal Timestamps</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
