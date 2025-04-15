//@ts-nocheck
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  HeartPulse,
  FileText,
  Download,
  UserIcon,
  Lock,
  LogOut,
  Calendar,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Search,
  Clock,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import dynamic from "next/dynamic"

const Loading = dynamic(() => import("../../loading"), { ssr: false })

interface Report {
  ReportID: string
  ReportURL: string
  BrainScans: {
    Date: string
  }
  Patient: {
    Doctor: {
      Name: string
    }
  }
}

interface Patient {
  PatientID: string
  Name: string
  email: string
  phone: string
}

export default function PatientDashboardComponent() {
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmailHovered, setIsEmailHovered] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchPatientAndReports = async () => {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user?.email) {
        console.error("Error fetching user", userError)
        setLoading(false)
        return
      }

      // Fetch Patient Info
      const { data: patient, error: patientError } = await supabase
        .from("Patients")
        .select("*")
        .eq("email", user.email)
        .single()

      if (patientError || !patient) {
        console.error("Error fetching patient", patientError)
        setLoading(false)
        return
      }

      setPatientInfo({
        PatientID: patient.PatientID,
        Name: patient.Name || "",
        email: patient.email,
        phone: patient.phone || "",
      })

      // Fetch Reports with Doctor's Name
      const { data: reportsData, error: reportsError } = await supabase
        .from("Reports")
        .select(`
          ReportID,
          ReportURL,
          BrainScans (Date),
          Patient:Patients (Doctor:HealthcareProviders (Name))
        `)
        .eq("PatientID", patient.PatientID)

      if (reportsError) {
        console.error("Error fetching reports", reportsError)
      } else {
        setReports(reportsData || [])
      }

      setLoading(false)
    }

    fetchPatientAndReports()
  }, [])

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!patientInfo) return
    setPatientInfo({ ...patientInfo, [e.target.name]: e.target.value })
    // Clear any previous messages when user starts editing
    setSuccessMessage("")
    setErrorMessage("")
  }

  const savePatientInfo = async () => {
    if (!patientInfo) return

    // Basic validation
    if (!patientInfo.Name.trim()) {
      setErrorMessage("Name cannot be empty")
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("Patients")
        .update({
          Name: patientInfo.Name,
          phone: patientInfo.phone,
        })
        .eq("PatientID", patientInfo.PatientID)

      if (error) {
        console.error("Failed to save patient info:", error)
        setErrorMessage("Failed to save information. Please try again.")
      } else {
        setSuccessMessage("Information saved successfully!")
        setTimeout(() => setSuccessMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error saving patient info:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const viewReportDetails = (url: string) => {
    window.open(url, "_blank")
  }

  const downloadReport = (url: string) => {
    try {
      const downloadUrl = `${url}?download`
      const link = document.createElement("a")
      link.href = downloadUrl
      const fileName = url.split("/").pop() || "report.pdf"
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading report:", error.message)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Helper function to format doctor's name as "First Initial. Last Name"
  const formatDoctorName = (name?: string): string => {
    if (!name) return "N/A"
    const nameParts = name.split(" ")
    if (nameParts.length === 1) return nameParts[0] // Single-word name

    const firstInitial = nameParts[0].charAt(0).toUpperCase()
    const lastName = nameParts[nameParts.length - 1]
    return `${firstInitial}. ${lastName}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  if (loading) return <Loading />

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center">
          <HeartPulse className="h-8 w-8 text-green-600 mr-2" />
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
            {patientInfo?.Name ? `${patientInfo.Name.split(" ")[0]}'s Dashboard` : "Patient Dashboard"}
          </h1>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient Info Section */}
        {patientInfo && (
          <Card className="col-span-1 border-none shadow-lg">
            <CardHeader className="bg-blue-100 rounded-t-lg">
              <CardTitle className="text-blue-800 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                My Information
              </CardTitle>
              <CardDescription className="text-blue-600">Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label htmlFor="Name" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  Full Name
                </label>
                <Input
                  id="Name"
                  type="text"
                  name="Name"
                  value={patientInfo.Name}
                  onChange={handleInfoChange}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={patientInfo.email}
                    className="bg-gray-100 cursor-not-allowed border-gray-300"
                    placeholder="Email Address"
                    onMouseEnter={() => setIsEmailHovered(true)}
                    onMouseLeave={() => setIsEmailHovered(false)}
                    readOnly
                  />
                  {isEmailHovered && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <Lock className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 ml-6">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-blue-500" />
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={patientInfo.phone}
                  onChange={handleInfoChange}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Phone Number"
                />
              </div>

              <Button
                onClick={savePatientInfo}
                disabled={isSaving}
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <UserIcon className="mr-2 h-4 w-4" /> Save Information
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reports Section */}
        <Card className="col-span-1 lg:col-span-2 border-none shadow-lg">
          <CardHeader className="bg-green-100 rounded-t-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-blue-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                My Medical Reports
              </CardTitle>
              <CardDescription className="text-green-700 m-0">
                {reports.length} {reports.length === 1 ? "report" : "reports"} available
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Report ID</TableHead>
                      <TableHead className="font-semibold">Report Date</TableHead>
                      <TableHead className="font-semibold">Doctor</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.ReportID} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{report.ReportID}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            {formatDate(report.BrainScans?.Date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-blue-500" />
                            {formatDoctorName(report.Patient?.Doctor?.Name)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                              onClick={() => viewReportDetails(report.ReportURL)}
                            >
                              <FileText className="h-4 w-4 mr-1" /> View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                              onClick={() => downloadReport(report.ReportURL)}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Search className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">No Reports Found</h3>
                <p className="text-gray-500 max-w-md">
                  You don't have any medical reports yet. Reports will appear here once your doctor uploads them.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
