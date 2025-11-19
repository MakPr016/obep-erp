"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Branch {
  id: string
  name: string
  code: string
  scheme_id: string
}

interface Scheme {
  id: string
  name: string
  year: number
}

interface AddClassModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  branches: Branch[]
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const SECTIONS = ["A", "B", "C", "D"]

export default function AddClassModal({ open, onClose, onSuccess, branches }: AddClassModalProps) {
  const [branchId, setBranchId] = useState("")
  const [semester, setSemester] = useState("")
  const [section, setSection] = useState("")
  const [academicYear, setAcademicYear] = useState("2023-24")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>("")
  const [loadingSchemes, setLoadingSchemes] = useState(false)

  useEffect(() => {
    if (open) {
      fetchSchemes()
    }
  }, [open])

  const fetchSchemes = async () => {
    setLoadingSchemes(true)
    try {
      const res = await fetch("/api/schemes")
      const data = await res.json()
      setSchemes(data.schemes || [])
    } catch {
      toast.error("Failed to load schemes")
    } finally {
      setLoadingSchemes(false)
    }
  }

  const filteredBranches = branches.filter(b => b.scheme_id === selectedSchemeId)

  const handleSubmit = async () => {
    setError(null)
    if (!branchId || !semester || !section || !academicYear) {
      setError("Please fill all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: branchId,
          semester: Number(semester),
          section,
          academic_year: academicYear,
          total_students: 0,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to add class")
      }
      setBranchId("")
      setSemester("")
      setSection("")
      setSelectedSchemeId("")
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Scheme *</Label>
            <Select value={selectedSchemeId} onValueChange={(val) => { setSelectedSchemeId(val); setBranchId("") }}>
              <SelectTrigger>
                {loadingSchemes ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select Scheme" />
                )}
              </SelectTrigger>
              <SelectContent>
                {schemes.map(scheme => (
                  <SelectItem key={scheme.id} value={scheme.id}>
                    {scheme.name} ({scheme.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Branch *</Label>
            <Select value={branchId} onValueChange={setBranchId} disabled={!selectedSchemeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {filteredBranches.map(br => (
                  <SelectItem key={br.id} value={br.id}>
                    {br.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Semester *</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map(s => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Section *</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger>
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map(sec => (
                  <SelectItem key={sec} value={sec}>
                    {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Academic Year *</Label>
            <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Adding...</span>
              </div>
            ) : (
              "Add Class"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
