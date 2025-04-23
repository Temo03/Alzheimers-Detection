"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Brain,
  Download,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  User,
  AlertCircle,
  Search,
  FileIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const Loading = dynamic(() => import("../../../../loading"), { ssr: false })

interface BrainScan {
  ImageID: string
  ImageType: string
  Date: string
  ImageURL: string
}

interface Patient {
  PatientID: string
  Name: string
  email: string
  phone: string
  Age?: number
  Gender?: string
}

type SortField = "Date" | "ImageType" | "fileName"
type SortDirection = "asc" | "desc"

export default function PatientMRIPage() {
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null)
  const [brainScans, setBrainScans] = useState<BrainScan[]>([])
  const [filteredScans, setFilteredScans] = useState<BrainScan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [imageTypeFilter, setImageTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>("Date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Extract unique image types for filtering
  const imageTypes =
    brainScans.length > 0 ? ["all", ...new Set(brainScans.map((scan) => scan.ImageType || "Unknown"))] : ["all"]

  useEffect(() => {
    const fetchPatientAndScans = async () => {
      try {
        setLoading(true)
        setError(null)

        const patientId = searchParams.get("patientId") // Get patient ID from query parameters

        if (!patientId) {
          setError("No patient ID provided")
          return
        }

        // Fetch Patient Info
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

        // Fetch Brain Scans for the selected patient
        const { data: scansData, error: scansError } = await supabase
          .from("BrainScans")
          .select("*")
          .eq("PatientID", patient.PatientID)
          .order("Date", { ascending: false })

        if (scansError) {
          setError("Error fetching brain scans")
          return
        }

        setBrainScans(scansData || [])
        setFilteredScans(scansData || [])
      } catch (err: any) {
        console.error(err.message)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchPatientAndScans()
  }, [searchParams])

  // Apply filters, sorting, and pagination
  useEffect(() => {
    let result = [...brainScans]

    // Apply image type filter
    if (imageTypeFilter !== "all") {
      result = result.filter((scan) => (scan.ImageType || "Unknown") === imageTypeFilter)
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((scan) => {
        const fileName = scan.ImageURL.split("/").pop() || ""
        return (
          (scan.ImageType || "").toLowerCase().includes(term) ||
          fileName.toLowerCase().includes(term) ||
          formatDate(scan.Date).toLowerCase().includes(term)
        )
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      if (sortField === "Date") {
        comparison = new Date(a.Date).getTime() - new Date(b.Date).getTime()
      } else if (sortField === "ImageType") {
        comparison = (a.ImageType || "").localeCompare(b.ImageType || "")
      } else if (sortField === "fileName") {
        const fileNameA = a.ImageURL.split("/").pop() || ""
        const fileNameB = b.ImageURL.split("/").pop() || ""
        comparison = fileNameA.localeCompare(fileNameB)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredScans(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [brainScans, searchTerm, imageTypeFilter, sortField, sortDirection])

  const downloadScan = async (scan: BrainScan) => {
    try {
      setDownloadingId(scan.ImageID)
      const response = await fetch(scan.ImageURL)
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      const fileName = scan.ImageURL.split("/").pop() || "brain-scan.jpg"
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Error downloading scan:", error)
    } finally {
      setDownloadingId(null)
    }
  }

  const deleteScan = async (scan: BrainScan) => {
    try {
      if (!confirm("Are you sure you want to delete this scan? This action cannot be undone.")) {
        return
      }

      setDeletingId(scan.ImageID)

      const { error } = await supabase.from("BrainScans").delete().eq("ImageID", scan.ImageID)

      if (error) {
        throw new Error(error.message)
      }

      // Update the local state to remove the deleted scan
      setBrainScans((prevScans) => prevScans.filter((s) => s.ImageID !== scan.ImageID))
      setFilteredScans((prevScans) => prevScans.filter((s) => s.ImageID !== scan.ImageID))
    } catch (error) {
      console.error("Error deleting scan:", error)
      setError("Failed to delete scan. Please try again.")
    } finally {
      setDeletingId(null)
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredScans.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedScans = filteredScans.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: SortField) => {
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
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-6 pt-6">
        <div className="flex items-center">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center">
              <Brain className="h-7 w-7 text-purple-600 mr-2" />
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">
                {patientInfo?.Name ? `${patientInfo.Name.split(" ")[0]}'s MRI Scans` : "Patient MRI Scans"}
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
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
      </div>

      {error && (
        <Card className="mb-6 mx-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Info Section */}
          {patientInfo && (
            <div className="lg:col-span-1">
              <Card className="border-none shadow-lg w-full">
                <CardHeader className="bg-blue-100 rounded-t-lg">
                  <CardTitle className="text-blue-800 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <User className="h-4 w-4 mr-2 text-blue-500" />
                        Full Name
                      </p>
                      <p className="font-medium text-gray-800 pl-6">{patientInfo.Name || "N/A"}</p>
                    </div>

                    <div>
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

                    <div>
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
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MRI Scans Section */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-purple-100 rounded-t-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-blue-800 flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    MRI Brain Scans
                  </CardTitle>
                  <CardDescription className="text-purple-700 m-0">
                    {brainScans.length} {brainScans.length === 1 ? "scan" : "scans"} available
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {brainScans.length > 0 ? (
                  <>
                    {/* Search and Filter Controls */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by type, filename or date..."
                          className="pl-8 bg-white border-gray-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={imageTypeFilter} onValueChange={setImageTypeFilter}>
                          <SelectTrigger className="w-full">
                            <div className="flex items-center">
                              <Filter className="h-4 w-4 mr-2 text-gray-500" />
                              <SelectValue placeholder="Filter by type" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {imageTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type === "all" ? "All Types" : type || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    {(searchTerm || imageTypeFilter !== "all") && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {searchTerm && (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
                          >
                            <Search className="h-3 w-3" />
                            Search: {searchTerm}
                            <button
                              className="ml-1 hover:bg-purple-100 rounded-full p-0.5"
                              onClick={() => setSearchTerm("")}
                            >
                              ✕
                            </button>
                          </Badge>
                        )}
                        {imageTypeFilter !== "all" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
                          >
                            <Filter className="h-3 w-3" />
                            Type: {imageTypeFilter}
                            <button
                              className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                              onClick={() => setImageTypeFilter("all")}
                            >
                              ✕
                            </button>
                          </Badge>
                        )}
                        {(searchTerm || imageTypeFilter !== "all") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-gray-500"
                            onClick={() => {
                              setSearchTerm("")
                              setImageTypeFilter("all")
                            }}
                          >
                            Clear all
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Results Summary */}
                    <div className="text-sm text-gray-500 mb-2">
                      Showing {paginatedScans.length} of {filteredScans.length} scans
                      {filteredScans.length !== brainScans.length && ` (filtered from ${brainScans.length} total)`}
                    </div>

                    {/* Table */}
                    {filteredScans.length > 0 ? (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead
                                className="font-semibold cursor-pointer"
                                onClick={() => handleSort("ImageType")}
                              >
                                <div className="flex items-center">
                                  Type
                                  {sortField === "ImageType" &&
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
                              <TableHead
                                className="font-semibold cursor-pointer"
                                onClick={() => handleSort("fileName")}
                              >
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
                              <TableHead className="font-semibold">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedScans.map((scan) => {
                              const fileName = scan.ImageURL.split("/").pop() || "brain-scan"
                              return (
                                <TableRow key={scan.ImageID} className="hover:bg-gray-50">
                                  <TableCell className="font-medium">{scan.ImageType || "Brain MRI"}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                                      {formatDate(scan.Date)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[200px] truncate" title={fileName}>
                                    <div className="flex items-center">
                                      <FileIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                      <span className="truncate">{fileName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="w-[220px]">
                                    <div className="flex gap-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                                        onClick={() => downloadScan(scan)}
                                        disabled={downloadingId === scan.ImageID || deletingId === scan.ImageID}
                                      >
                                        {downloadingId === scan.ImageID ? (
                                          <>
                                            <span className="animate-spin mr-2">⏳</span> Downloading...
                                          </>
                                        ) : (
                                          <>
                                            <Download className="h-4 w-4 mr-1" /> Download
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                        onClick={() => deleteScan(scan)}
                                        disabled={downloadingId === scan.ImageID || deletingId === scan.ImageID}
                                      >
                                        {deletingId === scan.ImageID ? (
                                          <>
                                            <span className="animate-spin mr-2">⏳</span> Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="h-4 w-4 mr-1"
                                            >
                                              <path d="M3 6h18"></path>
                                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                              <line x1="10" y1="11" x2="10" y2="17"></line>
                                              <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                            Delete
                                          </>
                                        )}
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
                        <p className="text-gray-500">No scans match your search criteria</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-purple-600"
                          onClick={() => {
                            setSearchTerm("")
                            setImageTypeFilter("all")
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
                            <ChevronLeft className="h-4 w-4" />
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
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No MRI Scans Found</h3>
                    <p className="text-gray-500 max-w-md">
                      There are no MRI scans available for this patient yet. Scans will appear here once they are
                      uploaded.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
