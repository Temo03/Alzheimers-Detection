'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardIcon, UserIcon, HeartPulse, FileText, Download } from 'lucide-react'

export default function PatientDashboardComponent() {
  const [patientInfo, setPatientInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890'
  })

  const [reports, setReports] = useState([
    { id: 1, date: '2023-06-01', doctor: 'Dr. Smith' },
    { id: 2, date: '2023-06-15', doctor: 'Dr. Johnson' },
    { id: 3, date: '2023-07-01', doctor: 'Dr. Williams' },
  ])

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientInfo({
      ...patientInfo,
      [e.target.name]: e.target.value
    })
  }

  const savePatientInfo = () => {
    console.log('Saving patient information:', patientInfo)
  }

  const viewReportDetails = (reportId: number) => {
    console.log('Viewing details for report:', reportId)
  }

  const downloadReport = (reportId: number) => {
    console.log('Downloading report:', reportId)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-blue-50 min-h-screen">
      <div className="flex items-center mb-6">
        <HeartPulse className="h-8 w-8 text-green-600 mr-2" />
        <h1 className="text-3xl font-bold text-blue-800">Patient&apos;s Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-blue-700 text-2xl">My Medical Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.doctor}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => viewReportDetails(report.id)}>
                        <FileText className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadReport(report.id)}>
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-blue-700">My Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                type="text" 
                name="name"
                value={patientInfo.name} 
                onChange={handleInfoChange}
                className="bg-white"
                placeholder="Full Name"
              />
              <Input 
                type="email" 
                name="email"
                value={patientInfo.email} 
                onChange={handleInfoChange}
                className="bg-white"
                placeholder="Email Address"
              />
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
      </div>
    </div>
  )
}