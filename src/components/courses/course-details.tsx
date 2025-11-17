"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

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

interface CourseOutcome {
  id: string
  co_number: string
  description: string
  blooms_level?: string
}

export function CourseDetails({ courseId }: { courseId: string }) {
  const [data, setData] = useState<{ course: Course; courseOutcomes: CourseOutcome[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
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
          <div className="mb-1 font-medium">Type: <span className="font-normal">{data.course.course_type}</span></div>
          <div className="mb-1 font-medium">Semester: <span className="font-normal">{data.course.semester}</span></div>
          <div className="mb-1 font-medium">NBA code: <span className="font-normal">{data.course.nba_code}</span></div>
          <div className="mb-1 font-medium">Target %: <span className="font-normal">{data.course.set_target_percentage * 100}%</span></div>
        </div>
        <div>
          <div className="mb-1 font-medium">Branch: <span className="font-normal">{data.course.branch_name} ({data.course.branch_code})</span></div>
          <div className="mb-1 font-medium">Department: <span className="font-normal">{data.course.department_name} ({data.course.department_code})</span></div>
          <div className="mb-1 font-medium">Scheme: <span className="font-normal">{data.course.scheme_name || "-"}</span></div>
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Course Outcomes (COs)</h2>
        {!data.courseOutcomes || data.courseOutcomes.length === 0 ? (
          <Button onClick={() => router.push(`/courses/${courseId}/update-co`)}>Add COs</Button>
        ) : (
          <div>
            <ul className="mb-3">
              {data.courseOutcomes.map((co, n) => (
                <li key={co.id} className="mb-1">
                  <span className="font-medium">CO{n + 1}:</span> {co.description}
                </li>
              ))}
            </ul>
            <Button variant="outline" onClick={() => router.push(`/courses/${courseId}/update-co`)}>Edit COs/Mapping</Button>
          </div>
        )}
      </div>
    </div>
  )
}
