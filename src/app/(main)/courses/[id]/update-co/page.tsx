"use client"
import dynamic from "next/dynamic"
import { use } from "react"

const Mapper = dynamic(() => import("@/components/courses/co-po-mapper"), { ssr: false })

export default function UpdateCOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <Mapper courseId={id} />
}
