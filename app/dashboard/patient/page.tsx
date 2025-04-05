//@ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HeartPulse, FileText, Download, UserIcon, Lock } from 'lucide-react'
import { createClient } from "@/utils/supabase/client"
import dynamic from "next/dynamic"; // Import dynamic for lazy loading

const Loading = dynamic(() => import("../../loading"), { ssr: false }); // Dynamically import loading.tsx

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
  const [successMessage, setSuccessMessage] = useState('')

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
        Name: patient.Name || '',
        email: patient.email,
        phone: patient.phone || '',
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
  }

  const savePatientInfo = async () => {
    if (!patientInfo) return
    const { error } = await supabase
      .from("Patients")
      .update({
        Name: patientInfo.Name,
        phone: patientInfo.phone,
      })
      .eq("PatientID", patientInfo.PatientID)

    if (error) {
      console.error("Failed to save patient info:", error)
    } else {
      setSuccessMessage("Information saved successfully!")
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const viewReportDetails = (url: string) => {
    window.open(url, "_blank")
  }

  const downloadReport = (url: string) => {
    try {
      const downloadUrl = `${url}?download`
      const link = document.createElement('a')
      link.href = downloadUrl
      const fileName = url.split('/').pop() || 'report.pdf'
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading report:', error.message)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Helper function to format doctor's name as "First Initial. Last Name"
  const formatDoctorName = (name?: string): string => {
    if (!name) return 'N/A'
    const nameParts = name.split(' ')
    if (nameParts.length === 1) return nameParts[0] // Single-word name

    const firstInitial = nameParts[0].charAt(0).toUpperCase()
    const lastName = nameParts[nameParts.length - 1]
    return `${firstInitial}. ${lastName}`
  }

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HeartPulse className="h-8 w-8 text-green-600 mr-2" />
          <h1 className="text-3xl font-bold text-blue-800">{patientInfo?.Name.split(' ')[0]}'s Dashboard</h1>
        </div>
        <Button onClick={logout} variant="outline" className="text-red-600 hover:bg-red-600 hover:text-white">
          Logout
        </Button>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Reports Section */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-blue-700 text-2xl">My Medical Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Report Date</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.ReportID}>
                      <TableCell>{report.ReportID}</TableCell>
                      <TableCell>
                        {report.BrainScans?.Date
                          ? new Date(report.BrainScans.Date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </TableCell>
                      {/* Displaying formatted doctor's name */}
                      <TableCell>{formatDoctorName(report.Patient?.Doctor?.Name)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => viewReportDetails(report.ReportURL)}>
                          <FileText className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadReport(report.ReportURL)}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500">No reports found.</p>
            )}
          </CardContent>
        </Card>

        {/* Patient Info Section */}
        {patientInfo && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-blue-700">My Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="text"
                  name="Name"
                  value={patientInfo.Name}
                  onChange={handleInfoChange}
                  className="bg-white"
                  placeholder="Full Name"
                />
                <div className="relative">
                  <Input
                    type="email"
                    name="email"
                    value={patientInfo.email}
                    className="bg-gray-100 cursor-not-allowed"
                    placeholder="Email Address"
                    onMouseEnter={() => setIsEmailHovered(true)}
                    onMouseLeave={() => setIsEmailHovered(false)}
                    readOnly
                  />
                  {isEmailHovered && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Lock className="text-gray-500" />
                    </div>
                  )}
                </div>
                <Input
                  type="tel"
                  name="phone"
                  value={patientInfo.phone}
                  onChange={handleInfoChange}
                  className="bg-white"
                  placeholder="Phone Number"
                />
              </div>
              <Button onClick={savePatientInfo} className="w-full mt-4 bg-green-600 hover:bg-green-700">
                <UserIcon className="mr-2 h-4 w-4" /> Save Information
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
