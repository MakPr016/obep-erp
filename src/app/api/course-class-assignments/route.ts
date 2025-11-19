// src/app/api/course-class-assignments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("class_id")
  const courseId = searchParams.get("courseId")

  let query = supabase
    .from("course_class_assignments")
    .select(`
      *,
      courses(id, course_code, course_name, semester),
      classes(id, semester, section, academic_year),
      users!course_class_assignments_faculty_id_fkey(id, full_name, email)
    `)
    .order("created_at", { ascending: false })

  if (classId) {
    query = query.eq("class_id", classId)
  }
  if (courseId) {
    query = query.eq("course_id", courseId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from("course_class_assignments")
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
