"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import CourseForm from "./course-form"

interface Course {
  id: string
  course_code: string
  course_name: string
  nba_code: string | null
  semester: number
  course_type: string
  branch_name: string
  branch_code: string
  department_name: string
  co_count: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function CourseList() {
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      const response = await fetch(`/api/courses?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setCourses(data.courses)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [searchParams])

  const getCourseTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      theory: "default",
      lab: "secondary",
      project_phase1: "outline",
      project_phase2: "outline",
    }

    return <Badge variant={variants[type] || "default"}>{type.replace("_", " ")}</Badge>
  }

  const handleAdd = () => {
    setEditingCourse(null)
    setShowForm(true)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setShowForm(true)
  }

  const handleFormSave = () => {
    fetchCourses()
  }

  const handleDelete = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return
    try {
      await fetch(`/api/courses/${courseId}`, { method: "DELETE" })
      fetchCourses()
    } catch (err) {
      console.error("Failed to delete course", err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>Add Course</Button>
      </div>

      <CourseForm
        open={showForm}
        onOpenChange={setShowForm}
        initial={editingCourse || undefined}
        onSave={handleFormSave}
      />

      {courses.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">No courses found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>COs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.course_code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.course_name}</div>
                        {course.nba_code && (
                          <div className="text-xs text-muted-foreground">NBA: {course.nba_code}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{course.branch_name}</div>
                        <div className="text-xs text-muted-foreground">{course.department_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>Sem {course.semester}</TableCell>
                    <TableCell>{getCourseTypeBadge(course.course_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.co_count} COs</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(course.id)}>
                        Delete
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/courses/${course.id}`}>
                          View <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} courses
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set("page", (pagination.page - 1).toString())
                    window.location.href = `/courses?${params.toString()}`
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set("page", (pagination.page + 1).toString())
                    window.location.href = `/courses?${params.toString()}`
                  }}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
