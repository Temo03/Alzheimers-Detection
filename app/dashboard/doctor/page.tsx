'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpIcon, UserPlusIcon, ClipboardIcon, UserIcon, Stethoscope } from 'lucide-react'
import axios from "axios"

export default function DoctorDashboardComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [patientName, setPatientName] = useState('')
  const [predictionResult, setPredictionResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const runMLModel = async () => {
    if (!selectedFile) return;
  
    setLoading(true); // Start loading state
    setPredictionResult(null); // Clear previous result
  
    try {
      const formData = new FormData();
      formData.append("file", selectedFile, selectedFile.name);
  
      const response = await axios.post("http://localhost:5000/predict/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      // Assuming response.data is { predicted_class: 'AD', confidence: 0.51 }
      const { predicted_class, confidence } = response.data;
      setPredictionResult(`Prediction: ${predicted_class} (Confidence: ${(confidence * 100).toFixed(2)}%)`);
    } catch (error) {
      setPredictionResult("Error: Failed to get prediction");
      console.error('API Error:', error);
    } finally {
      setLoading(false); // Stop loading state
    }
  };
  


  const viewPreviousReports = () => {
    console.log('Viewing previous reports')
  }

  const addNewPatient = () => {
    console.log(`Adding new patient: ${patientName}`)
    setPatientName('')
  }

  const viewEditPatientInfo = () => {
    console.log('Viewing/Editing patient information')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-blue-50 min-h-screen">
      <div className="flex items-center mb-6">
        <Stethoscope className="h-8 w-8 text-blue-600 mr-2" />
        <h1 className="text-3xl font-bold text-blue-800">Doctor&apos;s Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Upload New Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input type="file" onChange={handleFileUpload} className="bg-white" />
              <Button onClick={runMLModel} disabled={!selectedFile || loading} className="w-full bg-green-600 hover:bg-green-700">
                <FileUpIcon className="mr-2 h-4 w-4" /> {loading ? "Running..." : "Run ML Model"}
              </Button>

              {predictionResult && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md text-center">
                  {predictionResult}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Patient Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input 
                type="text" 
                placeholder="Enter patient name" 
                value={patientName} 
                onChange={(e) => setPatientName(e.target.value)}
                className="bg-white"
              />
              <Button onClick={addNewPatient} className="w-full bg-blue-600 hover:bg-blue-700">
                <UserPlusIcon className="mr-2 h-4 w-4" /> Add New Patient
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={viewPreviousReports} className="w-full bg-blue-600 hover:bg-blue-700">
              <ClipboardIcon className="mr-2 h-4 w-4" /> View Previous Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={viewEditPatientInfo} className="w-full bg-blue-600 hover:bg-blue-700">
              <UserIcon className="mr-2 h-4 w-4" /> View/Edit Patient Info
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
