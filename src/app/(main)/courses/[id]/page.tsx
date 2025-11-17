"use client"
import { CourseDetails } from "@/components/courses/course-details"
import { use } from "react"

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
  return <CourseDetails courseId={id} />
}
