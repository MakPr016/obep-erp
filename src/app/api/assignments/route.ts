import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const searchParams = req.nextUrl.searchParams
  const classId = searchParams.get("classId")
  const courseId = searchParams.get("courseId")

  if (!classId) {
    return NextResponse.json(
      { error: "classId is required" },
      { status: 400 }
    )
  }

  let query = supabase
    .from("assignments")
    .select(`
      id,
      title,
      status,
      due_date,
      courses:course_id (course_code, course_name),
      classes:class_id (section),
      assignment_questions (max_marks)
    `)
    .eq("class_id", classId)
    .order("created_at", { ascending: false })

  if (courseId) {
    query = query.eq("course_id", courseId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formatted = data.map((a: any) => ({
    id: a.id,
    title: a.title,
    totalMarks: a.assignment_questions?.reduce((sum: number, q: any) => sum + (q.max_marks || 0), 0) || 0,
    status: a.status,
    dueDate: a.due_date,
    courseCode: a.courses?.course_code,
    courseName: a.courses?.course_name,
    section: a.classes?.section,
  }))

  return NextResponse.json(formatted)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { title, description, status, dueDate, courseId, classId, questions } = body

  if (!title || !courseId || !classId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: "At least one question is required" },
      { status: 400 }
    )
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .insert({
      title,
      description,
      status,
      due_date: dueDate,
      course_id: courseId,
      class_id: classId,
    })
    .select()
    .single()

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  const questionInserts = questions.map((q: any) => ({
    assignment_id: assignment.id,
    question_number: q.questionNumber,
    question_label: q.questionLabel,
    max_marks: q.maxMarks,
    course_outcome_id: q.courseOutcomeId,
    blooms_level: q.bloomsLevel,
  }))

  const { error: questionsError } = await supabase
    .from("assignment_questions")
    .insert(questionInserts)

  if (questionsError) {
    await supabase.from("assignments").delete().eq("id", assignment.id)
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  return NextResponse.json(assignment)
}
