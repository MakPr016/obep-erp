"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: {
    id?: string
    course_name: string
    course_code: string
    nba_code?: string | null
    semester: number
    course_type: string
    branch_id?: string
  }
  onSave: () => void
}

const COURSE_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "lab", label: "Lab" },
  { value: "project_phase1", label: "Project Phase 1" },
  { value: "project_phase2", label: "Project Phase 2" },
  { value: "internship", label: "Internship" },
]

export default function CourseForm({ open, onOpenChange, initial, onSave }: CourseFormProps) {
  const [form, setForm] = useState({
    course_name: initial?.course_name || "",
    course_code: initial?.course_code || "",
    nba_code: initial?.nba_code || "",
    semester: initial?.semester || 1,
    course_type: initial?.course_type || "",
    branch_id: initial?.branch_id || "",
  })
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setForm({
        course_name: initial.course_name,
        course_code: initial.course_code,
        nba_code: initial.nba_code || "",
        semester: initial.semester,
        course_type: initial.course_type,
        branch_id: initial.branch_id || "",
      })
    }
  }, [initial])

  useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch("/api/branches")
        if (res.ok) {
          const data = await res.json()
          setBranches(data.branches || [])
        }
      } catch (err) {
        console.error("Failed to fetch branches", err)
      }
    }
    fetchBranches()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === "semester" ? Number(value) : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = initial?.id ? `/api/courses/${initial.id}` : "/api/courses"
      const method = initial?.id ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save course")
      }
      onSave()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Course" : "Add New Course"}</DialogTitle>
          <DialogDescription>
            {initial?.id ? "Update course details below." : "Fill in the course details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="course_name">Course Name</Label>
            <Input
              id="course_name"
              name="course_name"
              value={form.course_name}
              onChange={handleChange}
              placeholder="e.g. Data Structures"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_code">Course Code</Label>
            <Input
              id="course_code"
              name="course_code"
              value={form.course_code}
              onChange={handleChange}
              placeholder="e.g. CS101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nba_code">NBA Code (Optional)</Label>
            <Input
              id="nba_code"
              name="nba_code"
              value={form.nba_code || ""}
              onChange={handleChange}
              placeholder="e.g. NBA123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Input
              id="semester"
              name="semester"
              type="number"
              min={1}
              max={12}
              value={form.semester}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_type">Course Type</Label>
            <Select
              value={form.course_type}
              onValueChange={(value) => setForm(prev => ({ ...prev, course_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course type" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch_id">Branch</Label>
            <Select
              value={form.branch_id}
              onValueChange={(value) => setForm(prev => ({ ...prev, branch_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initial?.id ? "Update" : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
