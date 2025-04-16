// @ts-nocheck
"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpIcon, RotateCw, AlertCircle, Download, Save, User } from "lucide-react"
import axios from "axios"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@supabase/supabase-js"
import { Skeleton } from "@/components/ui/skeleton"

export default function MriAnalysisDashboard() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get("patientId")
  const [preprocessing, setPreprocessing] = useState(false)
  const [preprocessedImage, setPreprocessedImage] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [predictionResult, setPredictionResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heatmap, setHeatmap] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [patientName, setPatientName] = useState<string>("")
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    setSupabase(createClient(supabaseUrl, supabaseKey))

    if (patientId) fetchPatientName()
  }, [patientId])

  const fetchPatientName = async () => {
    try {
      const { data } = await supabase
        .from("Patients")
        .select("Name")
        .eq("PatientID", patientId)
        .single()
      if (data) setPatientName(data.Name)
    } catch (error) {
      console.error("Error fetching patient:", error)
      setPatientName("Unknown Patient")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".nii") && !file.name.endsWith(".nii.gz")) {
      setError("Please upload a valid NIfTI file (.nii or .nii.gz)")
      return
    }

    setError(null)
    setSelectedFile(file)
    setPreprocessing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await axios.post("http://localhost:8000/preprocess/", formData)
      setPreprocessedImage(`data:image/png;base64,${response.data.image_base64}`)
      setFileId(response.data.file_id)
    } catch (error) {
      console.error("Preprocessing Error:", error)
      setError("Failed to preprocess image")
    } finally {
      setPreprocessing(false)
    }
  }

  const runMLModel = async () => {
    if (!fileId) return

    setLoading(true)
    setPredictionResult(null)
    setHeatmap(null)

    try {
      const predictionResponse = await axios.get(`http://localhost:8000/predict/${fileId}`)
      setPredictionResult(predictionResponse.data)

      const heatmapResponse = await axios.get(`http://localhost:8000/gradcam/${fileId}`)
      setHeatmap(`data:image/png;base64,${heatmapResponse.data.heatmap}`)
    } catch (error) {
      console.error("API Error:", error)
      setError("Failed to process image")
    } finally {
      setLoading(false)
    }
  }

  if (!patientId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No patient selected. Please select a patient.</p>
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
          <h2 className="text-2xl font-bold text-blue-600">MRI Image Analysis</h2>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{patientName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-600">Image Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"
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
                  <Skeleton className="h-[250px] w-full rounded-md bg-gray-200" />
                  <div className="flex items-center gap-2 text-gray-500">
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Preprocessing MRI scan...</span>
                  </div>
                </div>
              ) : (
                preprocessedImage && (
                  <div className="mt-4 border rounded-md p-2 bg-white">
                    <p className="text-sm text-gray-500 mb-2">Preprocessed Image:</p>
                    <img
                      src={preprocessedImage}
                      alt="Preprocessed MRI"
                      className="max-h-[250px] object-contain mx-auto"
                    />
                  </div>
                )
              )}

              <Button
                onClick={runMLModel}
                disabled={!preprocessedImage || loading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                {loading ? (
                  <>
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileUpIcon className="mr-2 h-4 w-4" />
                    Run ML Analysis
                  </>
                )}
              </Button>
            </CardContent>
            
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-600">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {predictionResult ? (
                <div className="space-y-6">
                  <div className="p-4 bg-white rounded-md border border-gray-300">
                    <h3 className="font-medium mb-2 text-blue-600">Diagnosis:</h3>
                    <p className="mb-1 text-lg font-semibold">
                      {predictionResult.predicted_class} ({(predictionResult.probability * 100).toFixed(2)}%)
                    </p>

                    <h4 className="font-medium mt-4 mb-2 text-blue-600">Key Features:</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {Object.entries(predictionResult.features).map(([key, value]) => (
                        <li key={key} className="mb-1">
                          <span className="font-medium">{key}:</span> {value}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {heatmap && (
                    <div className="mt-6 border rounded-md p-2 bg-white">
                      <p className="text-sm text-gray-500 mb-2">Activation Heatmap:</p>
                      <img
                        src={heatmap}
                        alt="GradCAM Heatmap"
                        className="max-h-[300px] object-contain mx-auto"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Red areas indicate regions most influential in the diagnosis
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <p>Upload an image and run analysis to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
