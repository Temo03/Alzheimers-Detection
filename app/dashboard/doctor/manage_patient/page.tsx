//@ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/patient_form_button"
import { Input } from "@/components/ui/patient_form_input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/patient_form_card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/patient_form_table"
import { Label } from "@/components/ui/patient_form_label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/patient_form_radio-group"
import { HeartPulse, UserPlus, Pencil, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"; // Import dynamic for lazy loading

const Loading = dynamic(() => import("../../../loading"), { ssr: false }); // Dynamically import loading.tsx

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
    phone:"",
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [editMode, setEditMode] = useState(false)
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState<string>("")
  
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
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
          const { data: patientsData } = await supabase
            .from("Patients")
            .select("*")
            .eq("Doctor", doctorData.ProviderID)

          setPatients(patientsData || [])
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPatient({
      ...newPatient,
      [e.target.name]: e.target.value,
    })
  }

  const handleGenderChange = (value: "Male" | "Female") => {
    setNewPatient({
      ...newPatient,
      Gender: value,
    })
  }

  const handleSubmit = async () => {
    if (!newPatient.Name || !newPatient.Age || !doctorId) return

    try {
      const patientData = {
        Name: newPatient.Name,
        Age: Number(newPatient.Age),
        Gender: newPatient.Gender,
        email: newPatient.email,
        Doctor: doctorId,
        phone:newPatient.phone
      }

      if (editMode && currentPatientId) {
        // Update existing patient
        const { error } = await supabase
          .from("Patients")
          .update(patientData)
          .eq("PatientID", currentPatientId)

        if (!error) {
          setPatients(patients.map(p => 
            p.PatientID === currentPatientId ? { ...p, ...patientData } : p
          ))
        }
      } else {
        // Create new patient
        const { data, error } = await supabase
          .from("Patients")
          .insert(patientData)
          .select()

        if (!error && data) {
          setPatients([...patients, data[0]])
        }
      }

      // Reset form
      setNewPatient({ Name: "", Age: "", Gender: "Male", email: "", phone:"" })
      setEditMode(false)
      setCurrentPatientId(null)

    } catch (error) {
      console.error("Error saving patient:", error)
    }
  }

  const handleEdit = (patient: Patient) => {
    setNewPatient({
      Name: patient.Name ?? "",             // fallback to empty string if null
      Age: patient.Age?.toString() ?? "",   // convert to string and handle possible null
      Gender: patient.Gender ?? "Male",     // default to "Male" just in case
      email: patient.email,                 // this should always be present
      phone: patient.phone ?? "",           // fallback to empty string if null
    })
    setEditMode(true)
    setCurrentPatientId(patient.PatientID)
  }

  const handleDelete = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from("Patients")
        .delete()
        .eq("PatientID", patientId)

      if (!error) {
        setPatients(patients.filter(p => p.PatientID !== patientId))
      }
    } catch (error) {
      console.error("Error deleting patient:", error)
    }
  }
  

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-blue-50 min-h-screen">
      <div className="flex items-center mb-6">
        <HeartPulse className="h-8 w-8 text-green-600 mr-2" />
        <h1 className="text-3xl font-bold text-blue-800">Patient Information</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-blue-700 text-xl">
              {editMode ? "Edit Patient Information" : "Add New Patient"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="Name">Full Name</Label>
                <Input
                  id="Name"
                  type="text"
                  name="Name"
                  value={newPatient.Name}
                  onChange={handleInputChange}
                  className="bg-white"
                  placeholder="Patient's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Age">Age</Label>
                <Input
                  id="Age"
                  type="number"
                  name="Age"
                  value={newPatient.Age}
                  onChange={handleInputChange}
                  className="bg-white"
                  placeholder="Patient's age"
                  min="0"
                  max="120"
                />
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={newPatient.email}
                onChange={handleInputChange}
                className="bg-white"
                placeholder="Patient's email address"
              />
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                name="phone"
                value={newPatient.phone}
                onChange={handleInputChange}
                className="bg-white"
                placeholder="050-123-4567"
              />
            </div>
            </div>

            <div className="space-y-2 mb-6">
              <Label>Gender</Label>
              <RadioGroup
                value={newPatient.Gender}
                onValueChange={(value) => handleGenderChange(value as "Male" | "Female")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white">
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
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-blue-700 text-xl">Patient Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.PatientID}>
                    <TableCell className="font-medium">{patient.Name}</TableCell>
                    <TableCell>{patient.Age}</TableCell>
                    <TableCell>{patient.Gender}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(patient)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(patient.PatientID)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      No patients added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
