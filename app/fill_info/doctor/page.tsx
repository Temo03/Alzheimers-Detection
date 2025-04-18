"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/patient_form_button";
import { Input } from "@/components/ui/patient_form_input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/patient_form_card";
import { Label } from "@/components/ui/patient_form_label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope, CheckCircle, ArrowRight, Mail, User } from "lucide-react";

interface FormData {
  name: string;
  specialization: string;
  email: string;
}

interface Profile {
  first_login: boolean;
}

export default function DoctorSignupPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    specialization: "",
    email: "",
  });

  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specializations = [
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Obstetrics & Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Urology",
    "General Practice",
    "Other",
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      try {
        const { data: userData, error } = await supabase.auth.getUser();

        if (error) throw error;
        if (!userData?.user) redirect("/login");

        // Check if profile setup is already complete
        const { data: profile } = await supabase
        .from("profiles")
          .select("first_login")
          .eq("id", userData.user.id)
          .single();

        if (!profile?.first_login) redirect("/dashboard/doctor");

        setFormData((prev) => ({
          ...prev,
          email: userData.user.email || "",
        }));
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to load user data");
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSpecializationChange = (value: string) => {
    setFormData({
      ...formData,
      specialization: value,
    });
  };

  const isFormValid = () => {
    if (formStep === 1) return formData.name.trim() !== "";
    if (formStep === 2) return formData.specialization !== "";
    return true;
  };

  const handleNext = () => isFormValid() && setFormStep((prev) => prev + 1);
  const handleBack = () => setFormStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    try {
      // Check existing doctor
      const { data: existingDoctor, error: lookupError } = await supabase
        .from("HealthcareProviders")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (existingDoctor) throw new Error("Doctor with this email already exists");

      // Create HealthcareProvider entry
      const { error: insertError } = await supabase
        .from("HealthcareProviders")
        .insert([
          {
            Name: formData.name, // Capitalized column name
            Specialization: formData.specialization, // Capitalized column name
            email: formData.email, // Lowercase column name
          },
        ]);

      if (insertError) throw insertError;

      // Update profile completion status
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ first_login: false })
          .eq("id", userData.user.id);

        if (profileError) throw profileError;
      }

      setIsComplete(true);
      setTimeout(() => redirect("/dashboard/doctor"), 1500);
    } catch (error: any) {
      console.error("Submission error:", error);
      setError(error.message || "Failed to complete setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto animate-bounce" />
            <h2 className="text-2xl font-bold text-blue-800 mt-4">Profile Complete!</h2>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-blue-50 min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-md border-red-200 border-2">
          <CardContent className="text-center py-6">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex flex-col items-center justify-center">
      <div className="flex items-center mb-6">
        <Stethoscope className="h-8 w-8 text-blue-600 mr-2" />
        <h1 className="text-3xl font-bold text-blue-800">Complete Your Profile</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-blue-700">Doctor Information</CardTitle>
          <CardDescription>Please provide your professional details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Step 1 - Name Input */}
            {formStep === 1 && (
              <div className="space-y-4">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="pl-10" // Added padding to prevent overlap
                  />
                </div>
                <Button
                  onClick={handleNext}
                  disabled={!isFormValid()}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2 - Specialization Select */}
            {formStep === 2 && (
              <div className="space-y-4">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select value={formData.specialization} onValueChange={handleSpecializationChange}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!isFormValid()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 - Email Input */}
            {formStep === 3 && (
              <div className="space-y-4">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    required
                    className="pl-10 cursor-not-allowed" // Added styles here
                  />
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        Submitting...
                        <svg className="animate-spin h-4 w-4 ml-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      </span>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}