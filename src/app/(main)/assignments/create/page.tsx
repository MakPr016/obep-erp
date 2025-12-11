"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function CreateAssignmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const classId = searchParams.get("classId") ?? ""
  const courseId = searchParams.get("courseId") ?? ""

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [totalMarks, setTotalMarks] = React.useState(100)
  const [dueDate, setDueDate] = React.useState("")
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!classId || !courseId) {
      toast.error("Missing class or course. Please navigate from assignments page.")
    }
  }, [classId, courseId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!classId || !courseId) {
      toast.error("Context is missing. Please go back and try again.")
      return
    }
    if (!title.trim()) {
      toast.error("Title is required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          totalMarks: Number(totalMarks),
          status,
          dueDate: dueDate || null,
          courseId,
          classId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create assignment")
      }

      toast.success("Assignment created successfully!")
      router.push(`/assignments/course/${courseId}?classId=${classId}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Assignment
        </h1>
        <p className="text-sm text-muted-foreground">
          This assignment will be created for the selected class and course.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Data Structures Assignment 1"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the assignment..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Total Marks</label>
            <Input
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/assignments/course/${courseId}?classId=${classId}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Assignment
          </Button>
        </div>
      </form>
    </div>
  )
}
