"use client"
import dynamic from "next/dynamic"
import { use, useState, useEffect } from "react"

const Mapper = dynamic(() => import("@/components/courses/co-po-mapper"), { ssr: false })

export default function UpdateCOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [initialData, setInitialData] = useState<{ courseOutcomes: any[], programOutcomes: any[] } | null>(null)

  useEffect(() => {
    fetch(`/api/courses/${courseId}/cos`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.courseOutcomes) && Array.isArray(data.programOutcomes)) {
          setInitialData({
            courseOutcomes: data.courseOutcomes,
            programOutcomes: data.programOutcomes,
          })
        }
      })
  }, [courseId])

  if (!initialData) return <div>Loading...</div>

  return (
    <Mapper
      courseId={courseId}
      initialCOs={initialData.courseOutcomes}
      programOutcomes={initialData.programOutcomes}
    />
  )
}
