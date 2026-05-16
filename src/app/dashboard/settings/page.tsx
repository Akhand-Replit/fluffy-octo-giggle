"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, NotificationPreferences, PrivacySettings } from "@/lib/services/userService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Bell, Lock, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

type SaveState = "idle" | "saving" | "success" | "error";

function SaveFeedback({ state }: { state: SaveState }) {
  if (state === "saving") return <span className="text-sm text-muted-foreground">Saving...</span>;
  if (state === "success") return <span className="text-sm text-green-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved!</span>;
  if (state === "error") return <span className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Failed. Try again.</span>;
  return null;
}

export default function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSave, setProfileSave] = useState<SaveState>("idle");

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    emailOnApproval: true, emailOnRejection: true, emailOnNewEvent: false, pushNotifications: false,
  });
  const [notifSave, setNotifSave] = useState<SaveState>("idle");

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showProfile: true, showApplicationHistory: false,
  });
  const [privacySave, setPrivacySave] = useState<SaveState>("idle");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySave, setSecuritySave] = useState<SaveState>("idle");
  const [securityError, setSecurityError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFirstName((profile as any).firstName || "");
    setLastName((profile as any).lastName || "");
    setBio(profile.bio || "");
    setPhotoURL(profile.photoURL || "");
    setPhone((profile as any).phoneNumber || "");
    if ((profile as any).notificationPreferences) setNotifPrefs((profile as any).notificationPreferences);
    if ((profile as any).privacySettings) setPrivacy((profile as any).privacySettings);
  }, [profile]);

  async function saveProfile() {
    if (!user) return;
    setProfileSave("saving");
    try {
      await updateUserProfile(user.uid, { firstName, lastName, bio, photoURL, phoneNumber: phone } as any);
      await refreshProfile();
      setProfileSave("success");
      setTimeout(() => setProfileSave("idle"), 3000);
    } catch { setProfileSave("error"); }
  }

  async function saveNotifications() {
    if (!user) return;
    setNotifSave("saving");
    try {
      await updateUserProfile(user.uid, { notificationPreferences: notifPrefs } as any);
      setNotifSave("success");
      setTimeout(() => setNotifSave("idle"), 3000);
    } catch { setNotifSave("error"); }
  }

  async function savePrivacy() {
    if (!user) return;
    setPrivacySave("saving");
    try {
      await updateUserProfile(user.uid, { privacySettings: privacy } as any);
      setPrivacySave("success");
      setTimeout(() => setPrivacySave("idle"), 3000);
    } catch { setPrivacySave("error"); }
  }

  async function changePassword() {
    if (!user || !user.email) return;
    setSecurityError("");
    if (newPassword !== confirmPassword) { setSecurityError("New passwords do not match."); return; }
    if (newPassword.length < 6) { setSecurityError("Password must be at least 6 characters."); return; }
    setSecuritySave("saving");
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setSecuritySave("success");
      setTimeout(() => setSecuritySave("idle"), 3000);
    } catch (err: any) {
      setSecuritySave("error");
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setSecurityError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setSecurityError("New password is too weak.");
      } else {
        setSecurityError("Failed to update password. Try again.");
      }
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and security.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm"><User className="w-4 h-4" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm"><Bell className="w-4 h-4" /> Alerts</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5 text-xs sm:text-sm"><Shield className="w-4 h-4" /> Privacy</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm"><Lock className="w-4 h-4" /> Security</TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your public profile details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
              </div>
              <div className="space-y-2">
                <Label>Photo URL</Label>
                <Input value={photoURL} onChange={e => setPhotoURL(e.target.value)} placeholder="https://example.com/avatar.jpg" />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the MUN community about yourself..." rows={3} />
              </div>
            </CardContent>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
              <SaveFeedback state={profileSave} />
              <Button onClick={saveProfile} disabled={profileSave === "saving"}>Save Profile</Button>
            </div>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose when to receive email alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: "emailOnApproval" as const, label: "Application Approved", desc: "Email when your application gets approved." },
                { key: "emailOnRejection" as const, label: "Application Rejected", desc: "Email when your application is rejected." },
                { key: "emailOnNewEvent" as const, label: "New Events", desc: "Email when new conferences are published." },
                { key: "pushNotifications" as const, label: "Push Notifications", desc: "Browser push notifications for key updates." },
              ]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/10 border border-border/30">
                  <Checkbox
                    id={key}
                    checked={notifPrefs[key]}
                    onCheckedChange={val => setNotifPrefs(prev => ({ ...prev, [key]: !!val }))}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor={key} className="font-medium cursor-pointer">{label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
              <SaveFeedback state={notifSave} />
              <Button onClick={saveNotifications} disabled={notifSave === "saving"}>Save Preferences</Button>
            </div>
          </Card>
        </TabsContent>

        {/* PRIVACY */}
        <TabsContent value="privacy">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control what other users can see about you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: "showProfile" as const, label: "Public Profile", desc: "Allow other delegates to view your profile." },
                { key: "showApplicationHistory" as const, label: "Application History", desc: "Show your conference participation history publicly." },
              ]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/10 border border-border/30">
                  <Checkbox
                    id={key}
                    checked={privacy[key]}
                    onCheckedChange={val => setPrivacy(prev => ({ ...prev, [key]: !!val }))}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor={key} className="font-medium cursor-pointer">{label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
              <SaveFeedback state={privacySave} />
              <Button onClick={savePrivacy} disabled={privacySave === "saving"}>Save Privacy</Button>
            </div>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Requires current password to verify identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {securityError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {securityError}
                </p>
              )}
            </CardContent>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
              <SaveFeedback state={securitySave} />
              <Button
                onClick={changePassword}
                disabled={securitySave === "saving" || !currentPassword || !newPassword || !confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
