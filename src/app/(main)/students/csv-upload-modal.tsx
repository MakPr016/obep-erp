"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Combobox } from "@headlessui/react"
import { ChevronsUpDown } from "lucide-react"
import Papa from "papaparse"

interface Class {
  id: string
  branch_id: string
  semester: number
  section: string
  academic_year: string
}

interface CsvUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CsvUploadModal({ open, onClose, onSuccess }: CsvUploadModalProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [query, setQuery] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchClasses()
      setSelectedClass(null)
      setFile(null)
      setQuery("")
      setError(null)
    }
  }, [open])

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes")
      const json = await res.json()
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) {
      setError("Please select a CSV file")
      return
    }
    if (!selectedClass) {
      setError("Please select a class")
      return
    }
    setIsUploading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        try {
          const studentsWithClass = results.data.map((student: any) => ({
            ...student,
            class_id: selectedClass.id,
          }))
          const res = await fetch("/api/students/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: studentsWithClass }),
          })
          if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error || "Upload failed")
          }
          onSuccess()
          setFile(null)
          setSelectedClass(null)
          setQuery("")
        } catch (err: any) {
          setError(err.message)
        } finally {
          setIsUploading(false)
        }
      },
      error: err => {
        setError("Failed to parse CSV: " + err.message)
        setIsUploading(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Upload Students from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Class *</Label>
            <Combobox value={selectedClass} onChange={setSelectedClass}>
              <div className="relative">
                <Combobox.Input
                  className="w-full rounded border border-gray-300 py-2 pl-3 pr-10 text-sm leading-5"
                  onChange={e => setQuery(e.target.value)}
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
                        {({ selected }) => (
                          <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                            {`${cls.academic_year} Sem ${cls.semester} ${cls.section}`}
                          </span>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}
              </div>
            </Combobox>
          </div>
          <div>
            <Label>CSV File *</Label>
            <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm border rounded p-2" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={isUploading}>{isUploading ? "Uploading..." : "Upload"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
