// @ts-nocheck
"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { usePDF } from "react-to-pdf";

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileUpIcon,
  FileTextIcon,
  RotateCw,
  AlertCircle,
  Download,
  Save,
  User,
  ArrowLeft,
  HeartPulse,
} from "lucide-react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@supabase/supabase-js"
import html2canvas from 'html2canvas-pro'; // Use the pro version
export default function MriAnalysisDashboard() {
  const diagnosis = {
    AD: "Alzheimer's Disease",
    CN: "Cognitively Normal",
    MCI: "Mild Cognitive Impairment",
  };
  const searchParams = useSearchParams()
  const router = useRouter()
  const patientId = searchParams.get("patientId")

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [predictionResult, setPredictionResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [patientName, setPatientName] = useState<string>("")
  const [supabase, setSupabase] = useState<any>(null)
  const [preprocessedImage, setPreprocessedImage] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)
  const [preprocessing, setPreprocessing] = useState(false)
  const [heatmap, setHeatmap] = useState<string | null>(null)
  const { toPDF, targetRef } = usePDF({ filename: 'MRI-Analysis-Report.pdf' });
  // Initialize Supabase client and fetch patient info
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const client = createClient(supabaseUrl, supabaseKey)
    setSupabase(client)

    // Fetch patient name if patientId is available
    const fetchPatientName = async () => {
      if (!patientId) return

      try {
        const { data, error } = await client.from("Patients").select("Name").eq("PatientID", patientId).single()

        if (error) throw error
        if (data) setPatientName(data.Name)
      } catch (error) {
        console.error("Error fetching patient:", error)
        setPatientName("Unknown Patient")
      }
    }

    fetchPatientName()
  }, [patientId])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if file is a NIfTI file (.nii or .nii.gz)
    if (!file.name.endsWith(".nii") && !file.name.endsWith(".nii.gz")) {
      setError("Please upload a valid NIfTI file (.nii or .nii.gz)")
      setSelectedFile(null)
      setImagePreview(null)
      return
    }

    setError(null)
    setSelectedFile(file)
    setPreprocessing(true)

    try {
      // For demonstration purposes, we'll use a placeholder image
      // In a real application, you would use a library like NiiVue or Papaya to render NIfTI files
      setImagePreview("/placeholder.svg?height=300&width=300")

      // Upload to Supabase
      const timestamp = Date.now()
      const scanFileName = `${timestamp}-${file.name}`
      const scanFilePath = `${patientId}/${scanFileName}`

      const { data: scanData, error: scanError } = await supabase.storage.from("brainscans").upload(scanFilePath, file)

      if (scanError) throw scanError

      // Get public URL for the uploaded scan
      const { data: scanPublicURL } = supabase.storage.from("brainscans").getPublicUrl(scanFilePath)

      // Insert record into BrainScans table
      const brainScanRecord = {
        PatientID: patientId,
        ImageType: file.name.endsWith(".nii.gz") ? "NIfTI-GZ" : "NIfTI",
        ImageURL: scanPublicURL.publicUrl,
      }

      const { data: brainScanData, error: brainScanError } = await supabase
        .from("BrainScans")
        .insert(brainScanRecord)
        .select()

      if (brainScanError) throw brainScanError

      // Now send to preprocessing API
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await axios.post("http://localhost:8000/preprocess/", formData)
        setPreprocessedImage(`data:image/png;base64,${response.data.image_base64}`)
        setFileId(response.data.file_id)
      } catch (apiError) {
        console.error("API Error:", apiError)
        // If API fails, still show the placeholder
        setPreprocessedImage(imagePreview)
        setFileId("mock-file-id")
      }
    } catch (error) {
      console.error("Upload Error:", error)
      setError("Failed to upload image")
    } finally {
      setPreprocessing(false)
    }
  }

  // Run ML model on the uploaded image
  const runMLModel = async () => {
    if (!selectedFile || !fileId) return

    setLoading(true)
    setPredictionResult(null)
    setReport(null)
    setHeatmap(null)

    try {
      // Try to call the actual API
      try {
        const predictionResponse = await axios.get(`http://localhost:8000/predict/${fileId}`)
        setPredictionResult(predictionResponse.data)

        const heatmapResponse = await axios.get(`http://localhost:8000/gradcam/${fileId}`)
        setHeatmap(`data:image/png;base64,${heatmapResponse.data.heatmap}`)
      } catch (apiError) {
        console.error("API Error:", apiError)
        // Fall back to mock data if API fails
        // setPredictionResult({
        //   predicted_class: "Alzheimer's Disease",
        //   probability: 0.87,
        //   features: {
        //     hippocampal_volume: "Reduced by 23%",
        //     ventricle_size: "Enlarged by 18%",
        //     cortical_thickness: "Reduced in temporal lobe",
        //   },
        // })
      }
    } catch (error) {
      console.error("ML Model Error:", error)
      setError("Failed to process image")
    } finally {
      setLoading(false)
    }
  }

  // Generate report from ML results
  const generateReport = async () => {
    if (!predictionResult) return

    setGeneratingReport(true)

    try {
      // In a real application, you would call an API to generate the report
      // const response = await axios.post("http://localhost:5000/generate-report/", predictionResult)
      // setReport(response.data.report)

      // Mock report generation
      setTimeout(() => {
        const diagnosis = predictionResult.predicted_class || predictionResult.predicted_class
        const confidence = predictionResult.confidence || predictionResult.probability
        const features = predictionResult.features

        const reportText = `
# MRI Analysis Report

## Patient
Name: ${patientName}
ID: ${patientId}

## Diagnosis
The model predicts **${diagnosis}** with a confidence of **${(confidence * 100).toFixed(2)}%**.

## Key Findings
${Object.entries(features)
  .map(([key, value]) => `- **${key.replace("_", " ")}**: ${value}`)
  .join("\n")}

## Recommendations
Based on the findings, the following recommendations are made:
- Follow-up scan in 3 months
- Consultation with a neurologist
- Additional cognitive testing

## Technical Details
- Model: Deep Learning CNN
- Image Type: T1-weighted MRI
- Scan Date: ${new Date().toLocaleDateString()}
        `

        setReport(reportText)
      }, 1500)
    } catch (error) {
      console.error("Report Generation Error:", error)
    } finally {
      setGeneratingReport(false)
    }
  }

  // Save report to Supabase
  const saveReportToSupabase = async () => {
    if (!report || !selectedFile || !predictionResult || !patientId || !supabase) return

    setSaveStatus("saving")

    try {
      // Step 1: Get the ImageID from the already uploaded scan
      const { data: brainScans, error: brainScansError } = await supabase
        .from("BrainScans")
        .select("ImageID")
        .eq("PatientID", patientId)
        .order("Date", { ascending: false })
        .limit(1)

      if (brainScansError) throw brainScansError

      const imageID = brainScans[0]?.ImageID

      if (!imageID) {
        throw new Error("No image ID found for this patient")
      }

      // Step 2: Create report file and upload to reports bucket
      const timestamp = Date.now()
      const reportFileName = `${timestamp}-report.md`
      const reportFilePath = `${patientId}/${reportFileName}`

      const reportBlob = new Blob([report], { type: "text/markdown" })

      const { data: reportData, error: reportError } = await supabase.storage
        .from("reports")
        .upload(reportFilePath, reportBlob)

      if (reportError) throw reportError

      // Get public URL for the uploaded report
      const { data: reportPublicURL } = supabase.storage.from("reports").getPublicUrl(reportFilePath)

      // Step 3: Insert record into Reports table
      const reportRecord = {
        PatientID: patientId,
        ImageID: imageID,
        ReportURL: reportPublicURL.publicUrl,
      }

      const { data: reportRecordData, error: reportRecordError } = await supabase
        .from("Reports")
        .insert(reportRecord)
        .select()

      if (reportRecordError) throw reportRecordError

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving to Supabase:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }
  const downloadPDF = async () => {
    const element = document.getElementById('report-preview'); // The element you want to export
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 0, 0);
    pdf.save('MRI-Analysis-Report.pdf');
  };
  // Download report as markdown file
  const downloadReport = () => {
    if (!report || !selectedFile) return

    // Create blob from report text
    const blob = new Blob([report], { type: "text/markdown" })

    // Create download link
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    // Generate filename from original file
    const baseName = selectedFile.name.split(".")[0]
    a.download = `${patientName.replace(/\s+/g, "-")}-${baseName}-report.md`

    // Trigger download
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // If no patientId is provided, show an error
  if (!patientId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No patient selected. Please go back and select a patient.</p>
            <Button className="mt-4 w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <main className="max-w-7xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <HeartPulse className="h-8 w-8 text-green-600 mr-2" />
            <h2 className="text-2xl font-bold text-blue-600">MRI Image Analysis</h2>
          </div>

          {patientName && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{patientName}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Upload and Preview */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-600">Upload NIfTI MRI Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
                  accept=".nii,.nii.gz"
                />

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {preprocessing ? (
                  <div className="mt-4 space-y-4">
                    <div className="h-[250px] w-full rounded-md bg-gray-200 flex items-center justify-center">
                      <RotateCw className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>Preprocessing MRI scan...</span>
                    </div>
                  </div>
                ) : (
                  preprocessedImage && (
                    <div className="mt-4 border rounded-md p-2 bg-white">
                      <p className="text-sm text-gray-500 mb-2">Preprocessed Image:</p>
                      <div className="flex justify-center">
                        <img
                          src={preprocessedImage || imagePreview || "/placeholder.svg"}
                          alt="MRI Preview"
                          className="max-h-[250px] object-contain"
                        />
                      </div>
                    </div>
                  )
                )}

                <Button
                  onClick={runMLModel}
                  disabled={!selectedFile || loading || preprocessing}
                  className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150 shadow-md"
                >
                  {loading ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileUpIcon className="mr-2 h-4 w-4" />
                      Run ML Model
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ML Results and Report Generation */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-600">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {predictionResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-md border border-gray-300">
                    <h3 className="font-medium mb-2 text-blue-600">Diagnosis:</h3>
                    <p className="mb-1 text-lg font-semibold">
                      {diagnosis[predictionResult.predicted_class] + "( " + predictionResult.predicted_class + ")"  } 
                    </p>
                    <p>Probability of the Prediction being Correct: ({(predictionResult.probability * 100).toFixed(2)}%)</p>

                    {predictionResult.features && (
                      <div>
                        <h4 className="font-medium mb-1 text-blue-600">Key Features:</h4>
                        <ul className="list-disc pl-5 text-sm">
                          {Object.entries(predictionResult.features).map(([key, value]) => (
                            <li key={key}>
                              <span className="font-medium">{key.replace("_", " ")}:</span> {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {heatmap && (
                    <div className="mt-4 border rounded-md p-2 bg-white">
                      <p className="text-sm text-gray-500 mb-2">Activation Heatmap:</p>
                      <div className="flex justify-center">
                        <img
                          src={heatmap || "/placeholder.svg"}
                          alt="GradCAM Heatmap"
                          className="max-h-[250px] object-contain"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Red areas indicate regions most influential in the diagnosis
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={generateReport}
                    disabled={generatingReport}
                    className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-150 shadow-md"
                  >
                    {generatingReport ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <FileTextIcon className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <p>Upload an image and run the ML model to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Preview */}
        {report && (
          <Card className="mt-6 bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-blue-600">Generated Report</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={saveReportToSupabase}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Database
                    </>
                  )}
                </Button>
                <Button onClick={() => downloadPDF()} className="bg-green-600 text-white hover:bg-green-700">
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {saveStatus === "success" && (
                <div className="mb-4 p-2 bg-green-50 text-green-600 rounded-md flex items-center">
                  <span>Report and MRI scan saved successfully!</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md flex items-center">
                  <span>Error saving report and MRI scan</span>
                </div>
              )}
              <Tabs defaultValue="preview">
                <TabsList className="mb-4 bg-gray-100">
                  <TabsTrigger
                    value="preview"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600"
                  >
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="markdown"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600"
                  >
                    Markdown
                  </TabsTrigger>
                </TabsList>

                <TabsContent id="report-preview" value="preview" className="mt-0" ref={targetRef}>
                  <div className="p-4 bg-white rounded-md border border-gray-300 prose max-w-none">
                    <h1 className="text-2xl font-bold text-blue-600">MRI Analysis Report</h1>

                    <h2 className="text-xl font-semibold text-blue-600 mt-4">Patient</h2>
                    <p>
                      <strong>Name:</strong> {patientName}
                      <br />
                      <strong>ID:</strong> {patientId}
                    </p>

                    <h2 className="text-xl font-semibold text-blue-600 mt-4">Diagnosis</h2>
                    <p>
                      The model predicts <strong>{predictionResult.predicted_class}</strong> with a confidence of{" "}
                      <strong>
                        {((predictionResult.confidence || predictionResult.probability) * 100).toFixed(2)}%
                      </strong>
                      .
                    </p>

                    <h2 className="text-xl font-semibold text-blue-600 mt-4">Key Findings</h2>
                    <ul>
                      {Object.entries(predictionResult.features).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key.replace("_", " ")}:</strong> {value}
                        </li>
                      ))}
                    </ul>

                    <h2 className="text-xl font-semibold text-blue-600 mt-4">Recommendations</h2>
                    <ul>
                      <li>Follow-up scan in 3 months</li>
                      <li>Consultation with a neurologist</li>
                      <li>Additional cognitive testing</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-blue-600 mt-4">Technical Details</h2>
                    <ul>
                      <li>Model: Deep Learning CNN</li>
                      <li>Image Type: T1-weighted MRI</li>
                      <li>Scan Date: {new Date().toLocaleDateString()}</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="markdown" className="mt-0">
                  <Textarea
                    value={report}
                    readOnly
                    className="font-mono text-sm h-[400px] border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 focus:border-blue-500"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(report)}
                    className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Copy to Clipboard
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
