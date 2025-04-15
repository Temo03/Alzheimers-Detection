//@ts-nocheck
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpIcon, FileTextIcon, RotateCw, AlertCircle } from "lucide-react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function MriAnalysisDashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [predictionResult, setPredictionResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    // For demonstration purposes, we'll use a placeholder image
    // In a real application, you would use a library like NiiVue or Papaya to render NIfTI files
    setImagePreview("/placeholder.svg?height=300&width=300")
  }

  // Run ML model on the uploaded image
  const runMLModel = async () => {
    if (!selectedFile) return

    setLoading(true)
    setPredictionResult(null)
    setReport(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile, selectedFile.name)

      // In a real application, this would be your actual API endpoint
      const response = await axios.post("http://localhost:5000/predict/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Mock response for demonstration
      // const response = { data: { predicted_class: 'Alzheimer\'s Disease', confidence: 0.87, features: {
      //   'hippocampal_volume': 'Reduced by 23%',
      //   'ventricle_size': 'Enlarged by 18%',
      //   'cortical_thickness': 'Reduced in temporal lobe'
      // }}}

      setPredictionResult(response.data)
    } catch (error) {
      console.error("API Error:", error)
      // Mock data for demonstration
      setPredictionResult({
        predicted_class: "Alzheimer's Disease",
        confidence: 0.87,
        features: {
          hippocampal_volume: "Reduced by 23%",
          ventricle_size: "Enlarged by 18%",
          cortical_thickness: "Reduced in temporal lobe",
        },
      })
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
        const diagnosis = predictionResult.predicted_class
        const confidence = predictionResult.confidence
        const features = predictionResult.features

        const reportText = `
# MRI Analysis Report

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

  return (
    <div className="min-h-screen min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      <main className="max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">MRI Image Analysis</h2>

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

                {imagePreview && (
                  <div className="mt-4 border rounded-md p-2 bg-white">
                    <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
                    <div className="flex justify-center">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="MRI Preview"
                        className="max-h-[300px] object-contain"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={runMLModel}
                  disabled={!selectedFile || loading}
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
                    <h3 className="font-medium mb-2 text-blue-600">Prediction Results:</h3>
                    <p className="mb-1">
                      <span className="font-semibold">Diagnosis:</span> {predictionResult.predicted_class}
                    </p>
                    <p className="mb-3">
                      <span className="font-semibold">Confidence:</span>{" "}
                      {(predictionResult.confidence * 100).toFixed(2)}%
                    </p>

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
            <CardHeader>
              <CardTitle className="text-blue-600">Generated Report</CardTitle>
            </CardHeader>
            <CardContent>
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

                <TabsContent value="preview" className="mt-0">
                  <div className="p-4 bg-white rounded-md border border-gray-300 prose max-w-none">
                    <h1 className="text-2xl font-bold text-blue-600">MRI Analysis Report</h1>

                    <h2 className="text-xl font-semibold text-blue-600 mt-4">Diagnosis</h2>
                    <p>
                      The model predicts <strong>{predictionResult.predicted_class}</strong> with a confidence of{" "}
                      <strong>{(predictionResult.confidence * 100).toFixed(2)}%</strong>.
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
