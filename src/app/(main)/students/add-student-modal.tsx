"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Combobox } from "@headlessui/react"
import { ChevronsUpDown } from "lucide-react"

interface Class {
  id: string
  branch_id: string
  semester: number
  section: string
  academic_year: string
  branch_name?: string
}

interface AddStudentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddStudentModal({ open, onClose, onSuccess }: AddStudentModalProps) {
  const [usn, setUsn] = useState("")
  const [name, setName] = useState("")
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [query, setQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchClasses()
      setSelectedClass(null)
      setUsn("")
      setName("")
      setError(null)
    }
  }, [open])

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes")
      const json = await res.json()
      // Add branch name for display if possible (optional: fetch branches and map id -> name)
      setClasses(json.classes || [])
    } catch {
      setClasses([])
    }
  }

  const filteredClasses =
    query === ""
      ? classes
      : classes.filter(cls => {
          const label = `${cls.academic_year} Sem ${cls.semester} ${cls.section}`
          return label.toLowerCase().includes(query.toLowerCase())
        })

  const handleSubmit = async () => {
    setError(null)
    if (!usn || !name || !selectedClass) {
      setError("Please fill all required fields")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usn,
          name,
          class_id: selectedClass.id,
          is_active: true,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to add student")
      }
      setUsn("")
      setName("")
      setSelectedClass(null)
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="usn">USN *</Label>
            <Input id="usn" value={usn} onChange={e => setUsn(e.target.value)} placeholder="e.g., 1AB21CS001" />
          </div>
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Student name" />
          </div>
          <div>
            <Label>Class *</Label>
            <Combobox value={selectedClass} onChange={setSelectedClass}>
              <div className="relative">
                <Combobox.Input
                  className="w-full rounded border border-gray-300 py-2 pl-3 pr-10 text-sm leading-5"
                  onChange={event => setQuery(event.target.value)}
                  displayValue={(cls: Class) =>
                    cls ? `${cls.academic_year} Sem ${cls.semester} ${cls.section}` : ""
                  }
                  placeholder="Search class..."
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </Combobox.Button>

                {filteredClasses.length > 0 && (
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredClasses.map(cls => (
                      <Combobox.Option
                        key={cls.id}
                        value={cls}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? "bg-indigo-600 text-white" : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                              {`${cls.academic_year} Sem ${cls.semester} ${cls.section}`}
                            </span>
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}
              </div>
            </Combobox>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
