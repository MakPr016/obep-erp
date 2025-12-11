"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type CourseOutcome = {
  id: string
  co_number: string
  description: string
  blooms_level: string
}

type Question = {
  id?: string
  questionNumber: number
  questionLabel: string
  maxMarks: number
  courseOutcomeId: string
  bloomsLevel: string
}

type AssignmentData = {
  id: string
  title: string
  description: string | null
  status: "DRAFT" | "PUBLISHED"
  dueDate: string | null
  courseId: string
  classId: string
  questions: Question[]
}

const BLOOMS_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

export default function EditAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT")
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [courseOutcomes, setCourseOutcomes] = React.useState<CourseOutcome[]>([])
  const [courseId, setCourseId] = React.useState("")
  const [classId, setClassId] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData()
    }
  }, [assignmentId])

  async function fetchAssignmentData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/edit`)
      if (!res.ok) throw new Error("Failed to fetch assignment")
      const data: AssignmentData = await res.json()

      setTitle(data.title)
      setDescription(data.description || "")
      setStatus(data.status)
      setDueDate(data.dueDate || "")
      setCourseId(data.courseId)
      setClassId(data.classId)
      setQuestions(data.questions)

      await fetchCourseOutcomes(data.courseId)
    } catch (err) {
      toast.error("Failed to load assignment data")
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function fetchCourseOutcomes(courseId: string) {
    try {
      const res = await fetch(`/api/course-outcomes?courseId=${courseId}`)
      if (!res.ok) throw new Error("Failed to fetch course outcomes")
      const data = await res.json()
      setCourseOutcomes(data.data || [])
    } catch (err) {
      toast.error("Failed to load course outcomes")
    }
  }

  function addQuestion() {
    const newQuestionNumber = questions.length > 0 
      ? Math.max(...questions.map(q => q.questionNumber)) + 1 
      : 1
    setQuestions([
      ...questions,
      {
        questionNumber: newQuestionNumber,
        questionLabel: `Q${newQuestionNumber}`,
        maxMarks: 10,
        courseOutcomeId: "",
        bloomsLevel: "",
      },
    ])
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) {
      toast.error("At least one question is required")
      return
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  function updateQuestion(index: number, field: keyof Question, value: string | number) {
    setQuestions(
      questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title is required.")
      return
    }
    if (questions.length === 0) {
      toast.error("At least one question is required.")
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionLabel.trim()) {
        toast.error(`Question ${i + 1}: Label is required`)
        return
      }
      if (!q.courseOutcomeId) {
        toast.error(`Question ${i + 1}: Course Outcome is required`)
        return
      }
      if (!q.bloomsLevel) {
        toast.error(`Question ${i + 1}: Bloom's Level is required`)
        return
      }
      if (q.maxMarks <= 0) {
        toast.error(`Question ${i + 1}: Marks must be greater than 0`)
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status,
          dueDate: dueDate || null,
          questions: questions.map((q, idx) => ({
            id: q.id,
            questionNumber: idx + 1,
            questionLabel: q.questionLabel,
            maxMarks: Number(q.maxMarks),
            courseOutcomeId: q.courseOutcomeId,
            bloomsLevel: q.bloomsLevel,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update assignment")
      }

      toast.success("Assignment updated successfully!")
      router.push(`/assignments/course/${courseId}?classId=${classId}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const totalMarks = questions.reduce((sum, q) => sum + Number(q.maxMarks || 0), 0)

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Assignment
          </h1>
          <p className="text-sm text-muted-foreground">
            Update assignment details and questions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Data Structures Assignment 1"
              />
            </div>

            <div className="space-y-1">
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the assignment..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
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
              <div className="space-y-1">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={totalMarks}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Questions</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Question Label</Label>
                        <Input
                          required
                          value={question.questionLabel}
                          onChange={(e) =>
                            updateQuestion(index, "questionLabel", e.target.value)
                          }
                          placeholder="E.g., Q1, Part A"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Max Marks</Label>
                        <Input
                          type="number"
                          required
                          min={1}
                          value={question.maxMarks}
                          onChange={(e) =>
                            updateQuestion(index, "maxMarks", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Course Outcome</Label>
                        <Select
                          value={question.courseOutcomeId}
                          onValueChange={(v) =>
                            updateQuestion(index, "courseOutcomeId", v)
                          }
                        >
                          <SelectTrigger className="max-w-[300px]">
                            <SelectValue placeholder="Select CO" />
                          </SelectTrigger>
                          <SelectContent className="max-w-[300px]">
                            {courseOutcomes.map((co) => (
                              <SelectItem key={co.id} value={co.id}>
                                {co.co_number} - {co.description.substring(0, 50)}
                                {co.description.length > 50 ? "..." : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Bloom's Level</Label>
                        <Select
                          value={question.bloomsLevel}
                          onValueChange={(v) =>
                            updateQuestion(index, "bloomsLevel", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOOMS_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                      disabled={questions.length === 1}
                      className="mt-6"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
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
            Update Assignment
          </Button>
        </div>
      </form>
    </div>
  )
}
