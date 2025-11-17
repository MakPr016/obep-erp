"use client"

import { useEffect, useState } from "react"

interface Course {
  id: string
  course_code: string
  course_name: string
  nba_code: string | null
  semester: number
  course_type: string
  set_target_percentage: number
  class_target_percentage: number
  branch_id: string
  branch_name: string
  branch_code: string
  department_id: string
  department_name: string
  department_code: string
  scheme_name?: string
}

export function CourseDetails({ courseId }: { courseId: string }) {
  const [data, setData] = useState<{ course: Course } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/courses/${courseId}`)
      .then(res => res.json())
      .then(data => setData(data))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <div>Loading...</div>
  if (!data?.course) return <div className="text-destructive">Course not found</div>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{data.course.course_name} ({data.course.course_code})</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-1"><span className="font-medium">Type:</span> {data.course.course_type}</div>
          <div className="mb-1"><span className="font-medium">Semester:</span> {data.course.semester}</div>
          <div className="mb-1"><span className="font-medium">NBA code:</span> {data.course.nba_code}</div>
          <div className="mb-1"><span className="font-medium">Target %:</span> {data.course.set_target_percentage * 100}%</div>
        </div>
        <div>
          <div className="mb-1"><span className="font-medium">Branch:</span> {data.course.branch_name} ({data.course.branch_code})</div>
          <div className="mb-1"><span className="font-medium">Department:</span> {data.course.department_name} ({data.course.department_code})</div>
          <div className="mb-1"><span className="font-medium">Scheme:</span> {data.course.scheme_name || "-"}</div>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Course Outcomes (COs)</h2>
        <div className="italic text-muted-foreground">CO listing and editing coming soon...</div>
      </div>
    </div>
  )
}
