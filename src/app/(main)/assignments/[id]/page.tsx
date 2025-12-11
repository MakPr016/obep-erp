"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save, Calculator } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type AssignmentDetail = {
  id: string
  title: string
  description: string | null
  status: "DRAFT" | "PUBLISHED"
  totalMarks: number
  dueDate: string | null
  courseCode: string
  courseName: string
  section: string
}

type StudentRow = {
  id: string
  usn: string
  name: string
  marks: number | null
}

type MarksResponse = {
  assignment: AssignmentDetail
  students: StudentRow[]
}

type Statistics = {
  totalStudents: number
  studentsWithMarks: number
  averageMarks: number
  highestMarks: number
  lowestMarks: number
  passCount: number
  failCount: number
}

export default function AssignmentMarksPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string

  const [data, setData] = React.useState<MarksResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [changed, setChanged] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (!assignmentId) return
    fetchData()
  }, [assignmentId])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/marks`)
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to load marks data")
      }
      const json: MarksResponse = await res.json()
      setData(json)
      setChanged(new Set())
    } catch (err: any) {
      toast.error(err.message || "Failed to load assignment marks")
    } finally {
      setLoading(false)
    }
  }

  function handleMarkChange(studentId: string, value: string) {
    if (!data) return
    const num = value === "" ? null : Number(value)
    if (num !== null && (Number.isNaN(num) || num < 0)) {
      toast.error("Marks cannot be negative")
      return
    }
    if (num !== null && num > data.assignment.totalMarks) {
      toast.error(`Marks cannot exceed ${data.assignment.totalMarks}`)
      return
    }
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, marks: num } : s
        ),
      }
    })
    setChanged((prev) => {
      const next = new Set(prev)
      next.add(studentId)
      return next
    })
  }

  async function handleSave() {
    if (!data) return
    if (changed.size === 0) {
      toast.message("No changes to save")
      return
    }
    setSaving(true)
    try {
      const payload = data.students
        .filter((s) => changed.has(s.id))
        .map((s) => ({
          studentId: s.id,
          marks: s.marks,
        }))

      const res = await fetch(`/api/assignments/${assignmentId}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: payload }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to save marks")
      }
      toast.success("Marks saved successfully")
      setChanged(new Set())
    } catch (err: any) {
      toast.error(err.message || "Failed to save marks")
    } finally {
      setSaving(false)
    }
  }

  function calculateStatistics(): Statistics {
    if (!data) {
      return {
        totalStudents: 0,
        studentsWithMarks: 0,
        averageMarks: 0,
        highestMarks: 0,
        lowestMarks: 0,
        passCount: 0,
        failCount: 0,
      }
    }

    const studentsWithMarks = data.students.filter((s) => s.marks !== null)
    const marksArray = studentsWithMarks.map((s) => s.marks as number)
    const passThreshold = data.assignment.totalMarks * 0.4

    return {
      totalStudents: data.students.length,
      studentsWithMarks: studentsWithMarks.length,
      averageMarks:
        marksArray.length > 0
          ? marksArray.reduce((a, b) => a + b, 0) / marksArray.length
          : 0,
      highestMarks: marksArray.length > 0 ? Math.max(...marksArray) : 0,
      lowestMarks: marksArray.length > 0 ? Math.min(...marksArray) : 0,
      passCount: marksArray.filter((m) => m >= passThreshold).length,
      failCount: marksArray.filter((m) => m < passThreshold).length,
    }
  }

  if (loading || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { assignment, students } = data
  const stats = calculateStatistics()

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {assignment.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {assignment.courseCode} • {assignment.courseName} • Section{" "}
              {assignment.section}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={assignment.status === "PUBLISHED" ? "default" : "secondary"}
          >
            {assignment.status}
          </Badge>
          <Button onClick={handleSave} disabled={saving || changed.size === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Marks
          </Button>
        </div>
      </div>

      {assignment.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {assignment.description}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.studentsWithMarks} with marks entered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageMarks.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {assignment.totalMarks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Highest / Lowest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.highestMarks} / {stats.lowestMarks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Max and min marks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pass / Fail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className="text-green-600">{stats.passCount}</span> /{" "}
              <span className="text-red-600">{stats.failCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pass threshold: 40%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Student Marks Entry</CardTitle>
          <div className="text-xs text-muted-foreground space-x-4">
            <span>Total marks: {assignment.totalMarks}</span>
            {assignment.dueDate && (
              <span>
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            )}
            <span className="text-orange-600">
              Unsaved changes: {changed.size}
            </span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {students.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No students found for this assignment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">#</TableHead>
                  <TableHead className="w-[120px]">USN</TableHead>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="w-[140px] text-right">
                    Marks (/{assignment.totalMarks})
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s, index) => {
                  const passThreshold = assignment.totalMarks * 0.4
                  const isPassed =
                    s.marks !== null && s.marks >= passThreshold
                  const isFailed =
                    s.marks !== null && s.marks < passThreshold

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{s.usn}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="w-28 ml-auto text-right"
                          min={0}
                          max={assignment.totalMarks}
                          step={0.5}
                          value={s.marks ?? ""}
                          onChange={(e) =>
                            handleMarkChange(s.id, e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {s.marks === null ? (
                          <Badge variant="outline">Not graded</Badge>
                        ) : isPassed ? (
                          <Badge className="bg-green-600">Pass</Badge>
                        ) : (
                          <Badge variant="destructive">Fail</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || changed.size === 0}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save All Changes
        </Button>
      </div>
    </div>
  )
}
