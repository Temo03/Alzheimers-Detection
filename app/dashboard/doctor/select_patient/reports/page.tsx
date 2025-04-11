//@ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HeartPulse, FileText, Download } from 'lucide-react'
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
}

export default function PatientReportsPage() {
  const [patientInfo, setPatientInfo] = useState<Patient | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createClient()

  useEffect(() => {
    const fetchPatientAndReports = async () => {
      try {
        setLoading(true)

        const patientId = searchParams.get('patientId') // Get patient ID from query parameters

        if (!patientId) throw new Error("No patient ID provided")

        // Fetch Patient Info
        const { data: patient, error: patientError } = await supabase
          .from("Patients")
          .select("*")
          .eq("PatientID", patientId)
          .single()

        if (patientError || !patient) throw new Error("Error fetching patient info")

        setPatientInfo({
          PatientID: patient.PatientID,
          Name: patient.Name || '',
          email: patient.email,
          phone: patient.phone || '',
        })

        // Fetch Reports for the selected patient
        const { data: reportsData, error: reportsError } = await supabase
          .from("Reports")
          .select(`
            ReportID,
            ReportURL,
            BrainScans (Date)
          `)
          .eq("PatientID", patient.PatientID)

        if (reportsError) throw new Error("Error fetching reports")

        setReports(reportsData || [])
      } catch (error) {
        console.error(error.message)
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

  if (loading) return <Loading />

  return (
    <div className="p-6 max-w-7xl mx-auto bg-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <HeartPulse className="h-8 w-8 text-green-600 mr-2" />
          <h1 className="text-3xl font-bold text-blue-800">{patientInfo?.Name.split(' ')[0]}'s Reports</h1>
        </div>
        <Button onClick={() => router.push('/dashboard/doctor')} variant="outline" className="text-blue-600 hover:bg-blue-600 hover:text-white">
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Reports Section */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-blue-700 text-2xl">Medical Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Report Date</TableHead>
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
              <CardTitle className="text-blue-700">Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input type="text" value={patientInfo.Name} readOnly className="bg-gray-100 cursor-not-allowed" placeholder="Full Name" />
                <Input type="email" value={patientInfo.email} readOnly className="bg-gray-100 cursor-not-allowed" placeholder="Email Address" />
                <Input type="tel" value={patientInfo.phone} readOnly className="bg-gray-100 cursor-not-allowed" placeholder="Phone Number" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
