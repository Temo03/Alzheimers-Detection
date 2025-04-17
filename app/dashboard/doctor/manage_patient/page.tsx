//@ts-nocheck
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/patient_form_button"
import { Input } from "@/components/ui/patient_form_input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/patient_form_card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/patient_form_table"
import { Label } from "@/components/ui/patient_form_label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/patient_form_radio-group"
import { HeartPulse,ArrowLeft ,UserPlus, Pencil, Trash2, Search, X, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"

const Loading = dynamic(() => import("../../../loading"), { ssr: false })

interface Patient {
  PatientID: string
  Name: string
  Age: number
  Gender: "Male" | "Female"
  email: string
  phone: string
}

export default function PatientInputPage() {
  const [newPatient, setNewPatient] = useState({
    Name: "",
    Age: "",
    Gender: "Male" as "Male" | "Female",
    email: "",
    phone: "",
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [editMode, setEditMode] = useState(false)
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [formError, setFormError] = useState("")

  const supabase = createClient()
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email) {
        // Get doctor's ProviderID from HealthcareProviders table
        const { data: doctorData } = await supabase
          .from("HealthcareProviders")
          .select("ProviderID")
          .eq("email", user.email)
          .single()

        if (doctorData?.ProviderID) {
          setDoctorId(doctorData.ProviderID)
          // Fetch patients for this doctor
          const { data: patientsData } = await supabase.from("Patients").select("*").eq("Doctor", doctorData.ProviderID)

          setPatients(patientsData || [])
          setFilteredPatients(patientsData || [])
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // Filter patients when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter(
        (patient) =>
          patient.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.includes(searchTerm),
      )
      setFilteredPatients(filtered)
    }
  }, [searchTerm, patients])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPatient({
      ...newPatient,
      [e.target.name]: e.target.value,
    })
    setFormError("")
  }

  const handleGenderChange = (value: "Male" | "Female") => {
    setNewPatient({
      ...newPatient,
      Gender: value,
    })
  }

  const validateForm = () => {
    if (!newPatient.Name.trim()) {
      setFormError("Patient name is required")
      return false
    }
    if (!newPatient.Age) {
      setFormError("Patient age is required")
      return false
    }
    if (Number(newPatient.Age) <= 0 || Number(newPatient.Age) > 120) {
      setFormError("Please enter a valid age between 1 and 120")
      return false
    }
    if (newPatient.email && !/^\S+@\S+\.\S+$/.test(newPatient.email)) {
      setFormError("Please enter a valid email address")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !doctorId) return

    try {
      const patientData = {
        Name: newPatient.Name,
        Age: Number(newPatient.Age),
        Gender: newPatient.Gender,
        email: newPatient.email,
        Doctor: doctorId,
        phone: newPatient.phone,
      }

      if (editMode && currentPatientId) {
        // Update existing patient
        const { error } = await supabase.from("Patients").update(patientData).eq("PatientID", currentPatientId)

        if (!error) {
          setPatients(
            patients.map((p) =>
              p.PatientID === currentPatientId ? { ...p, ...patientData, PatientID: currentPatientId } : p,
            ),
          )
        }
      } else {
        // Create new patient
        const { data, error } = await supabase.from("Patients").insert(patientData).select()

        if (!error && data) {
          setPatients([...patients, data[0]])
        }
      }

      // Reset form
      setNewPatient({ Name: "", Age: "", Gender: "Male", email: "", phone: "" })
      setEditMode(false)
      setCurrentPatientId(null)
      setFormError("")
    } catch (error) {
      console.error("Error saving patient:", error)
      setFormError("An error occurred while saving the patient")
    }
  }

  const handleEdit = (patient: Patient) => {
    setNewPatient({
      Name: patient.Name ?? "",
      Age: patient.Age?.toString() ?? "",
      Gender: patient.Gender ?? "Male",
      email: patient.email ?? "",
      phone: patient.phone ?? "",
    })
    setEditMode(true)
    setCurrentPatientId(patient.PatientID)
    setFormError("")

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (patientId: string) => {
    if (confirm("Are you sure you want to delete this patient?")) {
      try {
        const { error } = await supabase.from("Patients").delete().eq("PatientID", patientId)

        if (!error) {
          setPatients(patients.filter((p) => p.PatientID !== patientId))
        }
      } catch (error) {
        console.error("Error deleting patient:", error)
      }
    }
  }

  const handleCancelEdit = () => {
    setNewPatient({ Name: "", Age: "", Gender: "Male", email: "", phone: "" })
    setEditMode(false)
    setCurrentPatientId(null)
    setFormError("")
  }

  if (loading) return <Loading />

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-b from-blue-50 to-green-50 overflow-auto">
      <div className="flex items-center mb-6 p-6">
        <div className="flex items-center mb-6 sm:mb-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 mr-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>


        <HeartPulse className="h-8 w-8 text-green-600 mr-2" />
        <h1 className="text-3xl font-bold text-blue-800">Patient Management</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 flex-grow px-6 pb-6">
        {/* Patient Form Card */}
        <Card className="col-span-1 border-none shadow-lg">
          <CardHeader className={`${editMode ? "bg-blue-100" : "bg-green-100"} rounded-t-lg`}>
            <CardTitle className="text-blue-800 text-xl flex items-center">
              {editMode ? (
                <Pencil className="mr-2 h-5 w-5 text-blue-600" />
              ) : (
                <UserPlus className="mr-2 h-5 w-5 text-green-600" />
              )}
              {editMode ? "Edit Patient Information" : "Add New Patient"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="Name" className="text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="Name"
                  type="text"
                  name="Name"
                  value={newPatient.Name}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Patient's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Age" className="text-gray-700">
                  Age <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="Age"
                  type="number"
                  name="Age"
                  value={newPatient.Age}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Patient's age"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={newPatient.email}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Patient's email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="text"
                  name="phone"
                  value={newPatient.phone}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="050-123-4567"
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <Label className="text-gray-700">
                Gender <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={newPatient.Gender}
                onValueChange={(value) => handleGenderChange(value as "Male" | "Female")}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male" className="text-gray-700">
                    Male
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female" className="text-gray-700">
                    Female
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSubmit}
                className={`flex-1 ${editMode ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"} text-white`}
              >
                {editMode ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Patient
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Patient
                  </>
                )}
              </Button>

              {editMode && (
                <Button onClick={handleCancelEdit} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Patient Records Card */}
        <Card className="col-span-1 border-none shadow-lg">
          <CardHeader className="bg-blue-100 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle className="text-blue-800 text-xl">Patient Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Age</TableHead>
                    <TableHead className="font-semibold">Gender</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.PatientID} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{patient.Name}</TableCell>
                      <TableCell>{patient.Age}</TableCell>
                      <TableCell>{patient.Gender}</TableCell>
                      <TableCell>{patient.phone || "-"}</TableCell>
                      <TableCell>{patient.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                            onClick={() => handleEdit(patient)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            onClick={() => handleDelete(patient.PatientID)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm ? (
                          <>
                            <Search className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                            No patients found matching "{searchTerm}"
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                            No patients added yet
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
