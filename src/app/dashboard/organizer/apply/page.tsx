"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserRole } from "@/lib/services/userService";

export default function OrganizerApplyPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    shortName: "",
    email: user?.email || "",
    audience: "",
    startDate: "",
    endDate: "",
    country: "",
    city: "",
    format: "",
    acceptedTerms: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      alert("You must accept the Terms and Conditions.");
      return;
    }
    if (!user) {
      alert("You must be logged in.");
      return;
    }

    setLoading(true);
    try {
      // Set the user as an organizer
      await updateUserRole(user.uid, "organizer");
      await refreshProfile();
      
      // Navigate to success page
      router.push(`/dashboard/organizer/apply/success?name=${encodeURIComponent(formData.shortName || formData.fullName)}`);
    } catch (error) {
      console.error("Error applying for organizer:", error);
      alert("Failed to process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-3xl"
      >
        <h1 className="text-3xl font-bold mb-2">The Basics</h1>
        <p className="text-sm text-muted-foreground mb-6">* Required Fields</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Conference Name *</Label>
              <Input 
                id="fullName" 
                required 
                value={formData.fullName} 
                onChange={e => handleChange("fullName", e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name or Acronym * (no Year, min 5 characters)</Label>
              <Input 
                id="shortName" 
                required 
                minLength={5}
                value={formData.shortName} 
                onChange={e => handleChange("shortName", e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Organizer Email *</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => handleChange("email", e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>What students should attend your conference? *</Label>
              <Select required value={formData.audience} onValueChange={v => handleChange("audience", v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="college">College / University</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-2">When and where?</h2>
            <p className="text-sm text-muted-foreground mb-4">* Required Fields</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  required 
                  value={formData.startDate} 
                  onChange={e => handleChange("startDate", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  required 
                  value={formData.endDate} 
                  onChange={e => handleChange("endDate", e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input 
                  id="country" 
                  placeholder="Country (Please type)" 
                  required 
                  value={formData.country} 
                  onChange={e => handleChange("country", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  required 
                  value={formData.city} 
                  onChange={e => handleChange("city", e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Is it in-person or online? *</Label>
              <Select required value={formData.format} onValueChange={v => handleChange("format", v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-person</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-border/50">
            <div className="flex items-start space-x-3 bg-secondary/20 p-4 rounded-xl border border-border/40">
              <Checkbox 
                id="terms" 
                checked={formData.acceptedTerms} 
                onCheckedChange={(c) => handleChange("acceptedTerms", c === true)} 
                className="mt-1"
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="terms" className="font-semibold text-base">
                  I accept the Terms and Conditions for this conference.
                </Label>
                <div className="text-sm text-muted-foreground h-32 overflow-y-auto pr-4 mt-2 bg-background p-3 rounded-md border border-border/40">
                  <p className="font-bold mb-2">Preamble, Parties, Definitions</p>
                  <p className="mb-2">Thank you for trusting mymun with your digital MUN conference infrastructure.</p>
                  <p className="mb-2">These terms and conditions (hereafter the "Agreement") govern the use of the online interface provided at https://mymun.com (the interface and all associated services and functionalities hereafter the "Platform") supplied by MyMUN GmbH, having its principal place of business at Raiffeisenstrasse 51, 71083 Herrenberg, Germany (hereafter "mymun" or "we") and the legal representative of a conference, workshop or other event listed on the Platform (hereafter an "Event" or "Events") using its online services (hereafter "you").</p>
                  <p className="font-bold mt-4 mb-2">1. Term, Scope</p>
                  <p className="mb-2">1.1 This Agreement shall come into force on the earlier of: (i) the date you list your conference through the Platform; or (ii) the date you claim the conference using the token provided by the mymun team after listing your conference on the Platform (the "Effective Date"). The Agreement shall end one year after the conference end date (the "Termination Date").</p>
                  <p className="mb-2">1.2 During this term, you can conduct applications, and, if applicable, payments and promotions, for all participants of the Event through the Platform.</p>
                  <p className="mb-2">1.3 After the Termination Date, you may continue to use the Platform to communicate with applicants and create and use statistics of their data.</p>
                  <p className="font-bold mt-4 mb-2">2. Pricing and Payment</p>
                  <p className="mb-2">2.1 If the Event is being held in, or you are legally situated in, any of the countries or territories listed in Schedule 1 of this Agreement, you can use integrated Stripe payments to receive payments from your Event's participants through the available payment methods provided by Stripe.</p>
                  <p className="mb-2">2.1.1 The payment processing fee amounts to 7 % of the total amount paid for an order basket. The payment processing fee includes taxes mymun has to pay on the payment processing fee and the fees Stripe charges for payment transfer.</p>
                  <p className="italic mb-2">For example, for an order basket of €100.00, the payment processing fee is €7.00, and the conference receives the remaining €93.00.</p>
                  <p className="mb-2">2.1.2 Discount codes lower the calculation basis of the payment processing fee.</p>
                  <p className="mb-2">2.1.3 The price of the individual item displayed is the sum of the payment processing fee and the amount the conference will receive. We reserve the right to lower the processing fee on an individual basis.</p>
                  <p className="mb-2">2.1.4 We shall issue an invoice for all such charges levied, as well as a payment confirmation for all parts of the payments that are forwarded to you and the participant through the online payment system.</p>
                  <p className="mb-2">2.1.5 If you receive payments outside of mymun that you would like to register on the Platform, you may manually add them as paid to the participant's application. This can be done free of charge until a currency-specific threshold is reached.</p>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full text-lg h-14 shadow-xl shadow-primary/25" disabled={loading}>
            {loading ? "Processing..." : "Submit Application"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
