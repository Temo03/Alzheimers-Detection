"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users, UserCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/client"; // Use client-side supabase client
import dynamic from "next/dynamic"; // Import dynamic for lazy loading

const Loading = dynamic(() => import("../../loading"), { ssr: false }); // Dynamically import loading.tsx



export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Check for valid session
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/login");
        return;
      }

      // Fetch doctor name
      const { data: doctorData, error: doctorError } = await supabase
        .from("HealthcareProviders")
        .select("Name")
        .eq("email", user.email)
        .single();

      if (doctorError) {
        console.error("Error fetching doctor name:", doctorError);
        router.push("/login");
        return;
      }

      setDoctorName(doctorData?.Name || "Doctor");
      setLoading(false);
    };

    // Add auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) router.push("/login");
    });

    fetchData();
    return () => subscription?.unsubscribe();
  }, [router, supabase.auth]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header - Keep existing layout */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-blue-800">MediTrack</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-700 font-medium">{doctorName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Keep existing layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-800 mb-2">
            Welcome Doctor {doctorName.split(" ")[0] || doctorName}
          </h2>
          <p className="text-blue-600">Manage your patients and medical records</p>
          <Separator className="mt-4 bg-blue-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manage Patients Card */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-700 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Manage Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add, edit, or remove patient records from your practice. Update medical history and personal
                information.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={() => router.push("/dashboard/doctor/manage_patient")}
              >
                Manage Patients
              </Button>
            </CardFooter>
          </Card>

          {/* Select Patient Card */}
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-700 flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                Select Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Choose a patient to work with.</p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => router.push("/dashboard/doctor/select_patient")}
              >
                Select Patient
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
