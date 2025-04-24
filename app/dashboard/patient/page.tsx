//@ts-nocheck
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  FileIcon,
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
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmailHovered, setIsEmailHovered] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<"ReportID" | "Date" | "fileName" | "Doctor">("Date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

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

      // Fetch Patient Info - Using original logic
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

      // Fetch Reports with Doctor's Name - Using original logic
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
        setFilteredReports(reportsData || [])
      }

      setLoading(false)
    }

    fetchPatientAndReports()
  }, [])

  // Apply filters, sorting, and pagination
  useEffect(() => {
    let result = [...reports]

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((report) => {
        const fileName = report.ReportURL.split("/").pop() || ""
        const doctorName = formatDoctorName(report.Patient?.Doctor?.Name)
        return (
          report.ReportID.toLowerCase().includes(term) ||
          fileName.toLowerCase().includes(term) ||
          doctorName.toLowerCase().includes(term) ||
          formatDate(report.BrainScans?.Date || "")
            .toLowerCase()
            .includes(term)
        )
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      if (sortField === "Date") {
        const dateA = a.BrainScans?.Date ? new Date(a.BrainScans.Date).getTime() : 0
        const dateB = b.BrainScans?.Date ? new Date(b.BrainScans.Date).getTime() : 0
        comparison = dateA - dateB
      } else if (sortField === "ReportID") {
        comparison = a.ReportID.localeCompare(b.ReportID)
      } else if (sortField === "fileName") {
        const fileNameA = a.ReportURL.split("/").pop() || ""
        const fileNameB = b.ReportURL.split("/").pop() || ""
        comparison = fileNameA.localeCompare(fileNameB)
      } else if (sortField === "Doctor") {
        const doctorA = formatDoctorName(a.Patient?.Doctor?.Name)
        const doctorB = formatDoctorName(b.Patient?.Doctor?.Name)
        comparison = doctorA.localeCompare(doctorB)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredReports(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [reports, searchTerm, sortField, sortDirection])

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
      // Using original update logic
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
      // Using original download logic
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: "ReportID" | "Date" | "fileName" | "Doctor") => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to descending
      setSortField(field)
      setSortDirection("desc")
    }
  }

  if (loading) return <Loading />

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-b from-blue-50 to-green-50 overflow-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-6 pt-6">
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
        <div className="mb-6 mx-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 mx-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mx-6 mb-6">
        {/* Patient Info Section */}
        {patientInfo && (
          <div className="lg:col-span-1">
            <Card className="border-none shadow-lg w-full">
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
          </div>
        )}

        {/* Reports Section */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-lg">
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
            <CardContent className="p-6">
              {reports.length > 0 ? (
                <>
                  {/* Search and Filter Controls */}
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by ID, filename, doctor or date..."
                        className="pl-8 bg-white border-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => setItemsPerPage(Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Items per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 per page</SelectItem>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="20">20 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {searchTerm && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                      >
                        <Search className="h-3 w-3" />
                        Search: {searchTerm}
                        <button
                          className="ml-1 hover:bg-green-100 rounded-full p-0.5"
                          onClick={() => setSearchTerm("")}
                        >
                          ✕
                        </button>
                      </Badge>
                    </div>
                  )}

                  {/* Results Summary */}
                  <div className="text-sm text-gray-500 mb-2">
                    Showing {paginatedReports.length} of {filteredReports.length} reports
                    {filteredReports.length !== reports.length && ` (filtered from ${reports.length} total)`}
                  </div>

                  {/* Table */}
                  {filteredReports.length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("ReportID")}>
                              <div className="flex items-center">
                                Report ID
                                {sortField === "ReportID" &&
                                  (sortDirection === "asc" ? (
                                    <SortAsc className="h-4 w-4 ml-1" />
                                  ) : (
                                    <SortDesc className="h-4 w-4 ml-1" />
                                  ))}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("Date")}>
                              <div className="flex items-center">
                                Date
                                {sortField === "Date" &&
                                  (sortDirection === "asc" ? (
                                    <SortAsc className="h-4 w-4 ml-1" />
                                  ) : (
                                    <SortDesc className="h-4 w-4 ml-1" />
                                  ))}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("Doctor")}>
                              <div className="flex items-center">
                                Doctor
                                {sortField === "Doctor" &&
                                  (sortDirection === "asc" ? (
                                    <SortAsc className="h-4 w-4 ml-1" />
                                  ) : (
                                    <SortDesc className="h-4 w-4 ml-1" />
                                  ))}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold cursor-pointer" onClick={() => handleSort("fileName")}>
                              <div className="flex items-center">
                                File Name
                                {sortField === "fileName" &&
                                  (sortDirection === "asc" ? (
                                    <SortAsc className="h-4 w-4 ml-1" />
                                  ) : (
                                    <SortDesc className="h-4 w-4 ml-1" />
                                  ))}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedReports.map((report) => {
                            const fileName = report.ReportURL.split("/").pop() || "report.pdf"
                            return (
                              <TableRow key={report.ReportID} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{report.ReportID}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-green-500" />
                                    {report.BrainScans?.Date ? formatDate(report.BrainScans.Date) : "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-2 text-blue-500" />
                                    {formatDoctorName(report.Patient?.Doctor?.Name)}
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={fileName}>
                                  <div className="flex items-center">
                                    <FileIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                    <span className="truncate">{fileName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
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
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-md bg-gray-50">
                      <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No reports match your search criteria</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-green-600"
                        onClick={() => {
                          setSearchTerm("")
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
    </div>
  )
}
