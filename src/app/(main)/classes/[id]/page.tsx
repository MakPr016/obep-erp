// src/app/(main)/classes/[id]/page.tsx
"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"

export default function ClassAssignmentsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const classId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [classInfo, setClassInfo] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [faculty, setFaculty] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [assignmentRows, setAssignmentRows] = useState<any[]>([{ courseId: "", facultyId: "" }])

  const isFaculty = session?.user?.role === "faculty"

  useEffect(() => {
    if (classId) {
      fetchClassInfo()
      fetchAssignments()
      fetchCourses()
      fetchFaculty()
    }
  }, [classId])

  const fetchClassInfo = async () => {
    try {
      const res = await fetch(`/api/classes/${classId}`)
      const json = await res.json()
      setClassInfo(json)
    } catch {
      setClassInfo(null)
    }
  }

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/course-class-assignments?class_id=${classId}`)
      const json = await res.json()
      setAssignments(Array.isArray(json.data) ? json.data : [])
    } catch {
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      const json = await res.json()
      setCourses(json.courses || [])
    } catch {
      setCourses([])
    }
  }

  const fetchFaculty = async () => {
    try {
      const res = await fetch("/api/faculty")
      const json = await res.json()
      setFaculty(json.faculty || [])
    } catch {
      setFaculty([])
    }
  }

  const addRow = () => {
    setAssignmentRows([...assignmentRows, { courseId: "", facultyId: "" }])
  }

  const removeRow = (index: number) => {
    setAssignmentRows(assignmentRows.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: string, value: string) => {
    setAssignmentRows(assignmentRows.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  const handleSaveAssignments = async () => {
    const validRows = assignmentRows.filter(row => row.courseId && row.facultyId)
    if (validRows.length === 0) {
      toast.error("Add at least one course-faculty assignment")
      return
    }
    setLoading(true)
    try {
      const payload = validRows.map(row => ({
        class_id: classId,
        course_id: row.courseId,
        faculty_id: row.facultyId,
        academic_year: classInfo?.academic_year || new Date().getFullYear().toString()
      }))
      const res = await fetch("/api/course-class-assignments/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success("Assignments saved")
        setAssignmentRows([{ courseId: "", facultyId: "" }])
        fetchAssignments()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to save assignments")
      }
    } catch {
      toast.error("Failed to save assignments")
    }
    setLoading(false)
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/course-class-assignments/${assignmentId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Assignment deleted")
        fetchAssignments()
      } else {
        toast.error("Failed to delete assignment")
      }
    } catch {
      toast.error("Failed to delete assignment")
    }
    setLoading(false)
  }

  if (loading && !classInfo) return <Skeleton className="h-40 w-full" />

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Classes
      </Button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Class Course Assignments</h1>
        {classInfo && (
          <div className="text-sm text-muted-foreground mt-1">
            {classInfo.branch?.name} • Sem {classInfo.semester} • Section {classInfo.section} • {classInfo.academic_year}
          </div>
        )}
      </div>

      {!isFaculty && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Assignments</h2>
          <div className="space-y-3">
            {assignmentRows.map((row, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Course</label>
                  <Select value={row.courseId} onValueChange={(val) => updateRow(index, "courseId", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Faculty</label>
                  <Select value={row.facultyId} onValueChange={(val) => updateRow(index, "facultyId", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="destructive" size="icon" onClick={() => removeRow(index)} disabled={assignmentRows.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={addRow}>
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
            <Button onClick={handleSaveAssignments} disabled={loading}>
              Save Assignments
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Current Assignments</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Faculty</TableHead>
              {!isFaculty && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isFaculty ? 2 : 3} className="text-center text-gray-500">
                  No assignments found
                </TableCell>
              </TableRow>
            ) : (
              assignments.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.courses?.course_name || "-"}</TableCell>
                  <TableCell>{a.users?.full_name || "-"}</TableCell>
                  {!isFaculty && (
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteAssignment(a.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
