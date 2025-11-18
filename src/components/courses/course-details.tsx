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

interface ProgramOutcome {
  id: string
  po_number: string
  description: string
}

interface COPOmap {
  mapping_strength: number
  program_outcome: ProgramOutcome
}

interface CourseOutcome {
  id: string
  co_number: string
  description: string
  blooms_level?: string
  co_po_mappings: COPOmap[]
}

export function CourseDetails({ courseId }: { courseId: string }) {
  const [data, setData] = useState<{ 
    course: Course
    courseOutcomes: CourseOutcome[]
    programOutcomes: ProgramOutcome[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/courses/${courseId}/cos`)
      .then(res => res.json())
      .then(data => setData(data))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <div>Loading...</div>
  if (!data?.course) return <div className="text-destructive">Course not found</div>

  const getStrengthColor = (strength: number) =>
    strength === 3 ? "text-green-600 font-bold"
      : strength === 2 ? "text-blue-600 font-bold"
      : strength === 1 ? "text-yellow-600 font-bold"
      : "text-gray-500 font-bold"

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
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
          <div className="overflow-auto">
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th className="border p-2 text-left">CO Number</th>
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2 text-left">Bloom's Level</th>
                  {data.programOutcomes?.map(po => (
                    <th key={po.id} className="border p-2 text-center">{po.po_number}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.courseOutcomes.map(co => (
                  <tr key={co.id}>
                    <td className="border p-2">{co.co_number}</td>
                    <td className="border p-2">{co.description}</td>
                    <td className="border p-2">{co.blooms_level || "-"}</td>
                    {data.programOutcomes?.map(po => {
                      const mapping = (co.co_po_mappings || []).find(
                        m => m.program_outcome?.id === po.id
                      )
                      return (
                        <td 
                          key={po.id} 
                          className={`border p-2 text-center ${getStrengthColor(mapping?.mapping_strength ?? 0)}`}
                        >
                          {mapping?.mapping_strength ?? 0}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="outline" className="mt-3" onClick={() => router.push(`/courses/${courseId}/update-co`)}>
              Edit COs / Mapping
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
