import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select(`
      id,
      title,
      description,
      status,
      due_date,
      course_id,
      class_id
    `)
    .eq("id", id)
    .single()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  const { data: questions, error: questionsError } = await supabase
    .from("assignment_questions")
    .select("id, question_number, question_label, max_marks, course_outcome_id, blooms_level")
    .eq("assignment_id", id)
    .order("question_number")

  if (questionsError) {
    return NextResponse.json(
      { error: questionsError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    status: assignment.status,
    dueDate: assignment.due_date,
    courseId: assignment.course_id,
    classId: assignment.class_id,
    questions: questions.map((q) => ({
      id: q.id,
      questionNumber: q.question_number,
      questionLabel: q.question_label,
      maxMarks: q.max_marks,
      courseOutcomeId: q.course_outcome_id,
      bloomsLevel: q.blooms_level,
    })),
  })
}
