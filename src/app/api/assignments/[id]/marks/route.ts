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
      total_marks,
      status,
      due_date,
      class_id,
      courses:course_id (course_code, course_name),
      classes:class_id (section)
    `)
    .eq("id", id)
    .single()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { error: assignmentError?.message || "Assignment not found" },
      { status: 404 }
    )
  }

  const { data: studentsData, error: studentsError } = await supabase
    .from("students")
    .select("id, usn, name")
    .eq("class_id", assignment.class_id)
    .eq("is_active", true)
    .order("usn")

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 })
  }

  const { data: marksData, error: marksError } = await supabase
    .from("assignment_student_marks")
    .select("student_id, marks_obtained")
    .eq("assignment_id", id)

  if (marksError) {
    return NextResponse.json({ error: marksError.message }, { status: 500 })
  }

  const marksMap = new Map<string, number>()
  marksData?.forEach((m) => {
    marksMap.set(m.student_id, m.marks_obtained)
  })

  const students = studentsData.map((student) => ({
    id: student.id,
    usn: student.usn,
    name: student.name,
    marks: marksMap.get(student.id) ?? null,
  }))

  const courses = Array.isArray(assignment.courses)
    ? assignment.courses[0]
    : assignment.courses
  const classes = Array.isArray(assignment.classes)
    ? assignment.classes[0]
    : assignment.classes

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      status: assignment.status,
      totalMarks: assignment.total_marks,
      dueDate: assignment.due_date,
      courseCode: courses?.course_code,
      courseName: courses?.course_name,
      section: classes?.section,
    },
    students,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  const { marks } = body

  if (!Array.isArray(marks)) {
    return NextResponse.json(
      { error: "Invalid data format. Expected 'marks' array." },
      { status: 400 }
    )
  }

  if (marks.length === 0) {
    return NextResponse.json({ success: true })
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("class_id")
    .eq("id", id)
    .single()

  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  const upsertData = marks.map((m: any) => ({
    assignment_id: id,
    class_id: assignment.class_id,
    student_id: m.studentId,
    marks_obtained: m.marks,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("assignment_student_marks")
    .upsert(upsertData, {
      onConflict: "assignment_id,student_id",
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
