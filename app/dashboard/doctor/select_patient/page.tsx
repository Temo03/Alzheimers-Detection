"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Search, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import dynamic from "next/dynamic"; // Import dynamic for lazy loading

const Loading = dynamic(() => import("../../../loading"), { ssr: false }); // Dynamically import loading.tsx


interface Patient {
  PatientID: string;
  Name: string;
  Age: number;
  Gender: string;
  email: string;
}

export default function SelectPatient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.email) {
          throw new Error("User not authenticated");
        }

        // Get doctor's ProviderID from HealthcareProviders table
        const { data: doctorData, error: doctorError } = await supabase
          .from("HealthcareProviders")
          .select("ProviderID")
          .eq("email", user.email)
          .single();

        if (doctorError || !doctorData) {
          throw new Error("Doctor profile not found");
        }

        // Fetch patients for this doctor
        const { data: patientsData, error: patientsError } = await supabase
          .from("Patients")
          .select("*")
          .eq("Doctor", doctorData.ProviderID);

        if (patientsError) {
          throw new Error("Error fetching patients");
        }

        setPatients(patientsData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) =>
    patient.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const selectPatient = (patientId: string) => {
    router.push(`/dashboard/doctor/select_patient/run_model?patientId=${patientId}`);
  };

  const viewReports = (patientId: string) => {
    router.push(`/dashboard/doctor/select_patient/reports?patientId=${patientId}`);
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-blue-800">Select Patient</h1>
        </div>

        <Card className="mb-6 border-blue-100">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patients by name..."
                className="pl-8 bg-white border-blue-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.PatientID}
              className="border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => selectPatient(patient.PatientID)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 border-2 border-blue-200">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(patient.Name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800">{patient.Name}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      {patient.Age} years, {patient.Gender}
                    </div>
                    <Separator className="my-3 bg-blue-100" />
                    <div className="mt-4 flex justify-between">
                      {/* Reports Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering `selectPatient`
                          viewReports(patient.PatientID);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Reports
                      </Button>

                      {/* Select Button */}
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <User className="h-3.5 w-3.5 mr-1" />
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-gray-500">No patients found matching your search criteria.</div>
        )}
      </div>
    </div>
  );
}
