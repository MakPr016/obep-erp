"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Trash2, Pencil, Eye, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type AssignmentRow = {
  id: string
  title: string
  status: "DRAFT" | "PUBLISHED"
  totalMarks: number
  dueDate: string | null
  courseCode: string
  courseName: string
  section: string
}

type Scheme = {
  id: string
  name: string
  year: number
}

type Branch = {
  id: string
  name: string
  code: string
}

type Class = {
  id: string
  section: string
  total_students: number
}

type Course = {
  id: string
  course_code: string
  course_name: string
}

export default function AssignmentsPage() {
  const [schemes, setSchemes] = React.useState<Scheme[]>([])
  const [branches, setBranches] = React.useState<Branch[]>([])
  const [classes, setClasses] = React.useState<Class[]>([])
  const [courses, setCourses] = React.useState<Course[]>([])
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([])

  const [selectedScheme, setSelectedScheme] = React.useState("")
  const [selectedBranch, setSelectedBranch] = React.useState("")
  const [selectedSemester, setSelectedSemester] = React.useState("")
  const [selectedClass, setSelectedClass] = React.useState("")
  const [selectedCourse, setSelectedCourse] = React.useState("all")

  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    fetchSchemes()
  }, [])

  React.useEffect(() => {
    if (selectedScheme) {
      fetchBranches()
    } else {
      setBranches([])
      setSelectedBranch("")
    }
  }, [selectedScheme])

  React.useEffect(() => {
    if (selectedBranch && selectedSemester) {
      fetchClasses()
    } else {
      setClasses([])
      setSelectedClass("")
    }
  }, [selectedBranch, selectedSemester])

  React.useEffect(() => {
    if (selectedClass) {
      fetchCourses()
      fetchAssignments()
    } else {
      setCourses([])
      setSelectedCourse("all")
      setAssignments([])
    }
  }, [selectedClass])

  React.useEffect(() => {
    if (selectedCourse && selectedCourse !== "all" && selectedClass) {
      fetchAssignments()
    }
  }, [selectedCourse])

  async function fetchSchemes() {
    try {
      const res = await fetch("/api/schemes")
      const data = await res.json()
      setSchemes(data.schemes || [])
    } catch {
      toast.error("Failed to load schemes")
    }
  }

  async function fetchBranches() {
    try {
      const res = await fetch(`/api/branches?schemeId=${selectedScheme}`)
      const data = await res.json()
      setBranches(data.branches || [])
    } catch {
      toast.error("Failed to load branches")
    }
  }

  async function fetchClasses() {
    try {
      const res = await fetch(
        `/api/classes?branchId=${selectedBranch}&semester=${selectedSemester}`
      )
      const data = await res.json()
      setClasses(data.classes || [])
    } catch {
      toast.error("Failed to load classes")
    }
  }

  async function fetchCourses() {
    try {
      const res = await fetch(
        `/api/courses?branchId=${selectedBranch}&semester=${selectedSemester}`
      )
      const data = await res.json()
      setCourses(data.courses || [])
    } catch {
      toast.error("Failed to load courses")
    }
  }

  async function fetchAssignments() {
    if (!selectedClass) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ classId: selectedClass })
      if (selectedCourse && selectedCourse !== "all")
        params.append("courseId", selectedCourse)

      const res = await fetch(`/api/assignments?${params}`)
      const data = await res.json()
      setAssignments(data || [])
    } catch {
      toast.error("Failed to load assignments")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this assignment?")) return
    const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" })
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      toast.success("Assignment deleted")
    } else {
      toast.error("Failed to delete assignment")
    }
  }

  const allFiltersSelected =
    selectedScheme && selectedBranch && selectedSemester && selectedClass

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Assignments
          </h1>
          <p className="text-sm text-muted-foreground">
            Select all filters to view and manage assignments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheme</label>
              <Select value={selectedScheme} onValueChange={setSelectedScheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scheme" />
                </SelectTrigger>
                <SelectContent>
                  {schemes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <Select
                value={selectedBranch}
                onValueChange={setSelectedBranch}
                disabled={!selectedScheme}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Semester</label>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
                disabled={!selectedBranch}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={!selectedSemester}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Section {c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {allFiltersSelected && courses.length > 0 && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">
                Filter by Course (Optional)
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.course_code} - {c.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {allFiltersSelected && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Available Courses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {course.course_code}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {course.course_name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full">
                    <Link
                      href={`/assignments/course/${course.id}?classId=${selectedClass}`}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Assignments
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href={`/assignments/create?classId=${selectedClass}&courseId=${course.id}`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {assignments.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mt-8">
                All Assignments
                {selectedCourse !== "all" && " (Filtered)"}
              </h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          {a.title}
                        </TableCell>
                        <TableCell>
                          {a.courseCode} - {a.courseName}
                        </TableCell>
                        <TableCell>{a.section}</TableCell>
                        <TableCell>{a.totalMarks}</TableCell>
                        <TableCell>{a.status}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/assignments/${a.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/assignments/${a.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(a.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}

      {!allFiltersSelected && (
        <div className="text-center py-12 text-muted-foreground">
          Please select all filters to view courses and assignments
        </div>
      )}
    </div>
  )
}
