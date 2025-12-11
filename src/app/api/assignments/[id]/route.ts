import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { title, description, status, dueDate, questions } = body

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    )
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: "At least one question is required" },
      { status: 400 }
    )
  }

  const { error: assignmentError } = await supabase
    .from("assignments")
    .update({
      title,
      description,
      status,
      due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (assignmentError) {
    return NextResponse.json(
      { error: assignmentError.message },
      { status: 500 }
    )
  }

  const { data: existingQuestions } = await supabase
    .from("assignment_questions")
    .select("id")
    .eq("assignment_id", id)

  const existingIds = existingQuestions?.map((q) => q.id) || []
  const incomingIds = questions.filter((q: any) => q.id).map((q: any) => q.id)
  const toDelete = existingIds.filter((id) => !incomingIds.includes(id))

  if (toDelete.length > 0) {
    await supabase
      .from("assignment_questions")
      .delete()
      .in("id", toDelete)
  }

  for (const q of questions) {
    if (q.id) {
      await supabase
        .from("assignment_questions")
        .update({
          question_number: q.questionNumber,
          question_label: q.questionLabel,
          max_marks: q.maxMarks,
          course_outcome_id: q.courseOutcomeId,
          blooms_level: q.bloomsLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", q.id)
    } else {
      await supabase
        .from("assignment_questions")
        .insert({
          assignment_id: id,
          question_number: q.questionNumber,
          question_label: q.questionLabel,
          max_marks: q.maxMarks,
          course_outcome_id: q.courseOutcomeId,
          blooms_level: q.bloomsLevel,
        })
    }
  }

  return NextResponse.json({ success: true })
}
