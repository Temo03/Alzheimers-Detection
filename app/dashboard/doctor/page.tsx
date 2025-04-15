"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Users, UserCheck, Stethoscope, Calendar } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import dynamic from "next/dynamic"

const Loading = dynamic(() => import("../../loading"), { ssr: false })

export default function DoctorDashboard() {
  const router = useRouter()
  const [doctorName, setDoctorName] = useState("Loading...")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Format current date
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Check for valid session
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        router.push("/login")
        return
      }

      // Fetch doctor name
      const { data: doctorData, error: doctorError } = await supabase
        .from("HealthcareProviders")
        .select("Name")
        .eq("email", user.email)
        .single()

      if (doctorError) {
        console.error("Error fetching doctor name:", doctorError)
        router.push("/login")
        return
      }

      setDoctorName(doctorData?.Name || "Doctor")
      setLoading(false)
    }

    // Add auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) router.push("/login")
    })

    fetchData()
    return () => subscription?.unsubscribe()
  }, [router, supabase.auth])

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Stethoscope className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-blue-800">MediTrack</span>
          </div>

          <div className="flex items-center">
            {/* Doctor's Full Name */}
            <span className="text-blue-700 font-medium mr-4 hidden sm:inline-block">Dr. {doctorName}</span>

            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push("/")
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Welcome Section with Current Date */}
      <div className="bg-blue-100 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-blue-800">
                Welcome, Dr. {doctorName.split(" ")[0] || doctorName}
              </h1>
              <p className="text-blue-600 max-w-xl">
                Access your patient records and provide quality care all in one place.
              </p>
            </div>

            {/* Current Date Display */}
            <div className="mt-4 md:mt-0 flex items-center bg-white rounded-lg px-4 py-3 shadow-sm">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">{currentDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-blue-800 mb-8">Quick Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Manage Patients Card - Hardcoded */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="h-2 bg-blue-500"></div>
            <div className="p-6">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-3">Manage Patients</h3>
              <p className="text-gray-600 mb-6">
                Add, edit, or remove patient records from your practice. Update medical history and personal
                information.
              </p>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
                onClick={() => router.push("/dashboard/doctor/manage_patient")}
              >
                Manage Patients
              </button>
            </div>
          </div>

          {/* Select Patient Card - Hardcoded */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="h-2 bg-green-500"></div>
            <div className="p-6">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-3">Select Patient</h3>
              <p className="text-gray-600 mb-6">
                Choose a patient to work with. View and update their medical records and information.
              </p>
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
                onClick={() => router.push("/dashboard/doctor/select_patient")}
              >
                Select Patient
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
