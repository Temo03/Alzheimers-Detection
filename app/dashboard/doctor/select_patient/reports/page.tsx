//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  HeartPulse,
  FileText,
  Download,
  ChevronLeft,
  Calendar,
  Mail,
  Phone,
  User,
  AlertCircle,
  Search,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import dynamic from "next/dynamic"

const Loading = dynamic(() => import("../../../../loading"), { ssr: false })

interface Report {
  ReportID: string
  ReportURL: string
  BrainScans: {
    Date: string
  }
}

interface Patient {
  PatientID: string
  Name: string
  email: string
  phone: string
  Age?: number
  Gender?: string
}

export default function PatientReportsPage() {
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createClient()

  useEffect(() => {
    const fetchPatientAndReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const patientId = searchParams.get("patientId") // Get patient ID from query parameters

        if (!patientId) {
          setError("No patient ID provided")
          return
        }

        // Fetch Patient Info - Keeping this exactly as in the original
        const { data: patient, error: patientError } = await supabase
          .from("Patients")
          .select("*")
          .eq("PatientID", patientId)
          .single()

        if (patientError || !patient) {
          setError("Error fetching patient information")
          return
        }

        setPatientInfo({
          PatientID: patient.PatientID,
          Name: patient.Name || "",
          email: patient.email || "",
          phone: patient.phone || "",
          Age: patient.Age,
          Gender: patient.Gender,
        })

        // Fetch Reports for the selected patient - Using the exact same query as the original
        const { data: reportsData, error: reportsError } = await supabase
          .from("Reports")
          .select(`
            ReportID,
            ReportURL,
            BrainScans (Date)
          `)
          .eq("PatientID", patient.PatientID)

        if (reportsError) {
          setError("Error fetching patient reports")
          return
        }

        setReports(reportsData || [])
      } catch (error) {
        console.error(error.message)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchPatientAndReports()
  }, [searchParams])

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
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mr-2 p-2 h-10 w-10 rounded-full hover:bg-blue-100"
          >
            <ChevronLeft className="h-5 w-5 text-blue-600" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <div className="flex items-center">
              <HeartPulse className="h-7 w-7 text-green-600 mr-2" />
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
                {patientInfo?.Name ? `${patientInfo.Name.split(" ")[0]}'s Reports` : "Patient Reports"}
              </h1>
            </div>
            {patientInfo && (
              <p className="text-blue-600 ml-9 mt-1">
                {patientInfo.Age && `${patientInfo.Age} years old`}
                {patientInfo.Age && patientInfo.Gender && " • "}
                {patientInfo.Gender}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => router.push("/dashboard/doctor")}
          variant="outline"
          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info Section */}
        {patientInfo && (
          <Card className="col-span-1 border-none shadow-lg">
            <CardHeader className="bg-blue-100 rounded-t-lg">
              <CardTitle className="text-blue-800 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  Full Name
                </p>
                <p className="font-medium text-gray-800 pl-6">{patientInfo.Name || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  Email Address
                </p>
                <p className="font-medium text-gray-800 pl-6">
                  {patientInfo.email ? (
                    <a href={`mailto:${patientInfo.email}`} className="text-blue-600 hover:underline">
                      {patientInfo.email}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-blue-500" />
                  Phone Number
                </p>
                <p className="font-medium text-gray-800 pl-6">
                  {patientInfo.phone ? (
                    <a href={`tel:${patientInfo.phone}`} className="text-blue-600 hover:underline">
                      {patientInfo.phone}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
              </div>


            </CardContent>
          </Card>
        )}

        {/* Reports Section */}
        <Card className="col-span-1 lg:col-span-2 border-none shadow-lg">
          <CardHeader className="bg-green-100 rounded-t-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-blue-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Medical Reports
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
                            {report.BrainScans?.Date ? formatDate(report.BrainScans.Date) : "N/A"}
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
                  There are no medical reports available for this patient yet. Reports will appear here once they are
                  uploaded.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
