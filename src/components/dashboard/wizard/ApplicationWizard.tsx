"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EventData } from "@/lib/services/eventService";
import { submitApplication, ApplicationData } from "@/lib/services/applicationService";
import { logActivity } from "@/lib/services/activityService";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface ApplicationWizardProps {
  event: EventData;
  userId: string;
}

const STEPS = ["Role Selection", "Preferences", "Experience", "Review"];

export function ApplicationWizard({ event, userId }: ApplicationWizardProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    role: "Delegate",
    choices: {
      primary: { committee: "", country: "" },
      secondary: { committee: "", country: "" },
      tertiary: { committee: "", country: "" },
    },
    experience: "",
    motivation: ""
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateChoice = (level: "primary" | "secondary" | "tertiary", field: "committee" | "country", value: string) => {
    setFormData(prev => ({
      ...prev,
      choices: {
        ...prev.choices,
        [level]: {
          ...prev.choices[level],
          [field]: value
        }
      }
    }));
  };

  const validateStep = () => {
    if (currentStep === 0) return !!formData.role;
    if (currentStep === 1) {
      // At least primary choice must be fully filled
      return !!formData.choices.primary.committee && !!formData.choices.primary.country;
    }
    if (currentStep === 2) {
      return !!formData.experience && !!formData.motivation;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep() && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);

    const payload: ApplicationData = {
      eventId: event.id,
      userId,
      role: formData.role,
      choices: formData.choices,
      experience: formData.experience,
      motivation: formData.motivation,
      status: "pending"
    };

    const res = await submitApplication(payload);
    setIsSubmitting(false);

    if (res.success) {
      logActivity({
        userId,
        actorName: profile?.displayName || "Delegate",
        actorRole: formData.role,
        type: "application_submitted",
        action: "submitted an application for",
        targetId: event.id,
        targetTitle: event.title,
        isPublic: true,
      });
      setIsSuccess(true);
    } else {
      alert("Failed to submit application. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <Card className="glass-card max-w-2xl mx-auto border-primary/20 text-center py-12">
        <CardContent className="flex flex-col items-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <CheckCircle2 className="w-24 h-24 text-green-500" />
          </motion.div>
          <h2 className="text-3xl font-bold">Application Submitted!</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your application for {event.title} has been successfully submitted. You can track its status in your dashboard.
          </p>
          <Button size="lg" className="mt-8" onClick={() => router.push("/dashboard/conferences")}>
            Go to My Conferences
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Derived data for choices
  const getCountriesForCommittee = (committeeName: string) => {
    const committee = event.committees?.find(c => c.name === committeeName);
    return committee?.countries || [];
  };

  return (
    <Card className="glass-card shadow-2xl overflow-hidden relative">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-secondary/50">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <CardHeader className="bg-secondary/10 border-b border-border/50 pb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </div>
          <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            {STEPS[currentStep]}
          </div>
        </div>
        <CardTitle className="text-2xl">{STEPS[currentStep]}</CardTitle>
        <CardDescription>
          {currentStep === 0 && "Select your desired participation role."}
          {currentStep === 1 && "Choose your preferred committees and countries."}
          {currentStep === 2 && "Tell us about your MUN experience and why you chose these preferences."}
          {currentStep === 3 && "Review your application details before submitting."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {currentStep === 0 && (
              <div className="space-y-6">
                <RadioGroup
                  value={formData.role}
                  onValueChange={(val) => updateFormData("role", val)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {[
                    { id: "Delegate", desc: "Participate as a standard country representative." },
                    { id: "Head Delegate", desc: "Lead a delegation from your institution." },
                    { id: "Observer", desc: "Attend to watch and learn without voting rights." }
                  ].map((role) => (
                    <div key={role.id}>
                      <RadioGroupItem value={role.id} id={role.id} className="peer sr-only" />
                      <Label
                        htmlFor={role.id}
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <span className="text-lg font-semibold mb-2">{role.id}</span>
                        <span className="text-sm text-center text-muted-foreground">{role.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8">
                {(["primary", "secondary", "tertiary"] as const).map((level, idx) => (
                  <div key={level} className="space-y-4 p-5 rounded-xl border border-border/50 bg-secondary/5 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 rounded-l-xl" />
                    <h3 className="font-semibold text-lg capitalize">{level} Choice {idx === 0 && <span className="text-red-500">*</span>}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Committee</Label>
                        <Select
                          value={formData.choices[level].committee}
                          onValueChange={(val) => {
                            updateChoice(level, "committee", val || "");
                            updateChoice(level, "country", ""); // Reset country when committee changes
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a committee" />
                          </SelectTrigger>
                          <SelectContent>
                            {event.committees && event.committees.length > 0 ? (
                              event.committees.map(c => (
                                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No committees available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select
                          value={formData.choices[level].country}
                          onValueChange={(val) => updateChoice(level, "country", val || "")}
                          disabled={!formData.choices[level].committee}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCountriesForCommittee(formData.choices[level].committee).length > 0 ? (
                              getCountriesForCommittee(formData.choices[level].committee).map(country => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="any">Any Available Country</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="experience" className="text-base">Previous MUN Experience <span className="text-red-500">*</span></Label>
                  <p className="text-sm text-muted-foreground">Briefly list your previous conferences, roles, and any awards.</p>
                  <Textarea
                    id="experience"
                    placeholder="e.g., Harvard MUN 2024 (Delegate of France, WHO) - Honorable Mention..."
                    className="min-h-[120px]"
                    value={formData.experience}
                    onChange={(e) => updateFormData("experience", e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="motivation" className="text-base">Motivation for Choices <span className="text-red-500">*</span></Label>
                  <p className="text-sm text-muted-foreground">Why do you want to participate in this conference and represent your chosen countries?</p>
                  <Textarea
                    id="motivation"
                    placeholder="I am deeply interested in global health policies..."
                    className="min-h-[120px]"
                    value={formData.motivation}
                    onChange={(e) => updateFormData("motivation", e.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">Applying As</h4>
                    <p className="text-xl font-bold">{formData.role}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider border-b border-border/50 pb-2">Your Preferences</h4>
                  {(["primary", "secondary", "tertiary"] as const).map((level) => {
                    const choice = formData.choices[level];
                    if (!choice.committee) return null;
                    return (
                      <div key={level} className="flex items-center justify-between bg-secondary/10 p-4 rounded-lg">
                        <span className="capitalize font-medium w-24">{level}:</span>
                        <span className="flex-1 font-semibold">{choice.committee}</span>
                        <span className="flex-1 text-right text-muted-foreground">{choice.country || "Any"}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4 border-t border-border/50 pt-4">
                  <div>
                    <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-2">Experience</h4>
                    <p className="text-sm bg-secondary/5 p-4 rounded-lg whitespace-pre-wrap">{formData.experience}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-2">Motivation</h4>
                    <p className="text-sm bg-secondary/5 p-4 rounded-lg whitespace-pre-wrap">{formData.motivation}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-border/50 bg-secondary/5 p-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!validateStep()}
            className="shadow-lg shadow-primary/20"
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!validateStep() || isSubmitting}
            className="shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Submit Application
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
