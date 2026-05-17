"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { doc, setDoc, writeBatch, serverTimestamp, collection } from "firebase/firestore";

export default function OnboardingPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    nationality: "",
    diet: "",
    invoiceType: "",
    street: "",
    city: "",
    postalCode: "",
    state: "",
    country: "",
    occupation: "",
    institution: "",
    fieldOfStudy: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
    role: "delegate",
    organizerOrganization: "",
    organizerRoleDescription: "",
  });

  useEffect(() => {
    if (!authLoading && profile?.onboardingComplete) {
      router.push("/dashboard");
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.role === "organizer-pending" && (!formData.organizerOrganization || !formData.organizerRoleDescription)) {
      alert("Please fill in the organization and experience fields for the Organizer role.");
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", user.uid);
      
      const userData: any = {
        ...formData,
        role: "delegate", // Default working role while pending
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
      };
      
      if (formData.role === "organizer-pending") {
        userData.organizerApplicationStatus = "pending";
        userData.pendingOrganizerToast = true;
        
        const orgAppRef = doc(collection(db, "organizerApplications"));
        batch.set(orgAppRef, {
          uid: user.uid,
          email: user.email,
          displayName: `${formData.firstName} ${formData.lastName}`,
          organization: formData.organizerOrganization,
          experience: formData.organizerRoleDescription,
          status: "pending",
          createdAt: serverTimestamp()
        });
      }
      
      batch.set(userRef, userData);
      await batch.commit();
      
      // Update global profile state
      await refreshProfile();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Complete your profile</CardTitle>
          <CardDescription>
            Please fill in your information before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" required value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" required value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={(e) => handleChange("email", e.target.value)} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input id="dob" type="date" required value={formData.dob} onChange={(e) => handleChange("dob", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input id="nationality" placeholder="Nationality (Please type)" required value={formData.nationality} onChange={(e) => handleChange("nationality", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet">Diet *</Label>
                  <Select onValueChange={(v) => handleChange("diet", (v as string) || "")}>
                    <SelectTrigger><SelectValue placeholder="Click to select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="halal">Halal</SelectItem>
                      <SelectItem value="kosher">Kosher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Your role on MyMUN</h3>
              <RadioGroup 
                value={formData.role} 
                onValueChange={(val) => handleChange("role", val)}
                className="grid gap-4 pt-2"
              >
                <div>
                  <RadioGroupItem value="delegate" id="role-delegate" className="peer sr-only" />
                  <Label
                    htmlFor="role-delegate"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="w-full text-left">
                      <span className="block font-semibold text-lg mb-1">Delegate</span>
                      <span className="block text-sm text-muted-foreground font-normal">I want to apply to conferences and participate as a delegate, observer, or faculty advisor.</span>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="organizer-pending" id="role-organizer" className="peer sr-only" />
                  <Label
                    htmlFor="role-organizer"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="w-full text-left">
                      <span className="block font-semibold text-lg mb-1">Organizer</span>
                      <span className="block text-sm text-muted-foreground font-normal">I want to create and run MUN conferences. Your account will be reviewed by our team before organizer features unlock.</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Organizer Extra Fields with smooth height transition */}
              <div 
                className={`grid gap-4 overflow-hidden transition-all duration-300 ease-in-out ${formData.role === "organizer-pending" ? "grid-rows-[1fr] opacity-100 pt-4" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="min-h-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizerOrganization">Organization name *</Label>
                    <Input 
                      id="organizerOrganization" 
                      required={formData.role === "organizer-pending"} 
                      value={formData.organizerOrganization} 
                      onChange={(e) => handleChange("organizerOrganization", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizerRoleDescription">Tell us about your MUN experience *</Label>
                    <Textarea 
                      id="organizerRoleDescription" 
                      required={formData.role === "organizer-pending"} 
                      value={formData.organizerRoleDescription} 
                      onChange={(e) => handleChange("organizerRoleDescription", e.target.value)}
                      placeholder="Share your past experience organizing or participating in MUNs..."
                      className="min-h-[100px]"
                      minLength={50}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.organizerRoleDescription.length}/500 chars (min 50)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Invoice Address</h3>
              <div className="space-y-2">
                <Label htmlFor="invoiceType">Invoice Type</Label>
                <Select onValueChange={(v) => handleChange("invoiceType", (v as string) || "")}>
                  <SelectTrigger><SelectValue placeholder="Click to select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Street and number *</Label>
                  <Input id="street" required value={formData.street} onChange={(e) => handleChange("street", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" required value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code *</Label>
                  <Input id="postalCode" required value={formData.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State (optional)</Label>
                  <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input id="country" placeholder="Country (Please type)" required value={formData.country} onChange={(e) => handleChange("country", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Select onValueChange={(v) => handleChange("occupation", (v as string) || "")}>
                    <SelectTrigger><SelectValue placeholder="Click to select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution *</Label>
                  <Input id="institution" required value={formData.institution} onChange={(e) => handleChange("institution", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                  <Input id="fieldOfStudy" placeholder="Select field of study" required value={formData.fieldOfStudy} onChange={(e) => handleChange("fieldOfStudy", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Social Media (optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" placeholder="Username" value={formData.instagram} onChange={(e) => handleChange("instagram", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input id="tiktok" placeholder="Username" value={formData.tiktok} onChange={(e) => handleChange("tiktok", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input id="linkedin" placeholder="Profile URL" value={formData.linkedin} onChange={(e) => handleChange("linkedin", e.target.value)} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
