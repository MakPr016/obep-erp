"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Pencil, Eye, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type AssignmentRow = {
  id: string
  title: string
  status: "DRAFT" | "PUBLISHED"
  totalMarks: number
  dueDate: string | null
}

type CourseDetails = {
  course_code: string
  course_name: string
}

export default function CourseAssignmentsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params.courseId as string
  const classId = searchParams.get("classId")

  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([])
  const [courseDetails, setCourseDetails] = React.useState<CourseDetails | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (courseId && classId) {
      loadData()
    }
  }, [courseId, classId])

  async function loadData() {
    setLoading(true)
    try {
      const courseRes = await fetch(`/api/courses/${courseId}`)
      if (courseRes.ok) {
        const data = await courseRes.json()
        setCourseDetails(data.course)
      }

      const assignmentsRes = await fetch(
        `/api/assignments?courseId=${courseId}&classId=${classId}`
      )
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData)
      } else {
        throw new Error("Failed to fetch assignments")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load page data.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this assignment?")) return

    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== id))
        toast.success("Assignment deleted successfully.")
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to delete assignment.")
      }
    } catch (err) {
      toast.error("An error occurred while deleting the assignment.")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {courseDetails?.course_name || "Course"} Assignments
          </h1>
          <p className="text-sm text-muted-foreground">
            {courseDetails?.course_code}
          </p>
        </div>
        <div className="ml-auto">
          <Button asChild>
            <Link href={`/assignments/create?classId=${classId}&courseId=${courseId}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        {assignments.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No assignments found for this course.</p>
            <p className="text-sm mt-2">Click "New Assignment" to create one.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>{a.totalMarks}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.status === "PUBLISHED" ? "default" : "secondary"
                      }
                    >
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="ghost" size="icon" title="View Details">
                      <Link href={`/assignments/${a.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" title="Edit">
                      <Link href={`/assignments/${a.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(a.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
