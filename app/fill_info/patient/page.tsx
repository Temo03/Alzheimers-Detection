"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/patient_form_button"
import { Input } from "@/components/ui/patient_form_input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/patient_form_card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/patient_form_table"
import { Label } from "@/components/ui/patient_form_label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/patient_form_radio-group"
import { HeartPulse, UserPlus, Pencil, Trash2 } from "lucide-react"

interface Patient {
  id: number
  name: string
  age: number
  gender: "Male" | "Female"
  email: string
}

export default function PatientInputPage() {
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male" as "Male" | "Female",
    email: "",
  })

  const [patients, setPatients] = useState<Patient[]>([
    { id: 1, name: "John Doe", age: 45, gender: "Male", email: "john.doe@example.com" },
    { id: 2, name: "Jane Smith", age: 32, gender: "Female", email: "jane.smith@example.com" },
    { id: 3, name: "Robert Johnson", age: 58, gender: "Male", email: "robert.j@example.com" },
  ])

  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPatient({
      ...newPatient,
      [e.target.name]: e.target.value,
    })
  }

  const handleGenderChange = (value: "Male" | "Female") => {
    setNewPatient({
      ...newPatient,
      gender: value,
    })
  }

  const addPatient = () => {
    if (!newPatient.name || !newPatient.age) return

    if (editMode && editId) {
      setPatients(
        patients.map((patient) =>
          patient.id === editId
            ? {
                ...patient,
                name: newPatient.name,
                age: Number(newPatient.age),
                gender: newPatient.gender,
                email: newPatient.email,
              }
            : patient,
        ),
      )
      setEditMode(false)
      setEditId(null)
    } else {
      const newId = Math.max(0, ...patients.map((p) => p.id)) + 1
      setPatients([
        ...patients,
        {
          id: newId,
          name: newPatient.name,
          age: Number(newPatient.age),
          gender: newPatient.gender,
          email: newPatient.email,
        },
      ])
    }

    // Reset form
    setNewPatient({
      name: "",
      age: "",
      gender: "Male",
      email: "",
    })
  }

  const editPatient = (id: number) => {
    const patient = patients.find((p) => p.id === id)
    if (patient) {
      setNewPatient({
        name: patient.name,
        age: patient.age.toString(),
        gender: patient.gender,
        email: patient.email,
      })
      setEditMode(true)
      setEditId(id)
    }
  }

  const deletePatient = (id: number) => {
    setPatients(patients.filter((patient) => patient.id !== id))
  }

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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={newPatient.name}
                  onChange={handleInputChange}
                  className="bg-white"
                  placeholder="Patient's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  name="age"
                  value={newPatient.age}
                  onChange={handleInputChange}
                  className="bg-white"
                  placeholder="Patient's age"
                  min="0"
                  max="120"
                />
              </div>
            </div>

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

            <div className="space-y-2 mb-6">
              <Label>Gender</Label>
              <RadioGroup
                value={newPatient.gender}
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

            <Button onClick={addPatient} className="w-full bg-green-600 hover:bg-green-700 text-white">
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
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={() => editPatient(patient.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => deletePatient(patient.id)}
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

