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
      total_marks,
      status,
      due_date,
      courses:course_id (course_code, course_name),
      classes:class_id (section)
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
    totalMarks: a.total_marks,
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

  const { title, description, totalMarks, status, dueDate, courseId, classId } = body

  if (!title || !courseId || !classId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      title,
      description,
      total_marks: totalMarks,
      status,
      due_date: dueDate,
      course_id: courseId,
      class_id: classId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
