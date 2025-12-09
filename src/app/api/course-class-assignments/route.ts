// src/app/api/course-class-assignments/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("class_id")
  const courseId = searchParams.get("courseId")

  let query = supabase
    .from("course_class_assignments")
    .select(`
      *,
      courses(id, course_code, course_name, semester),
      classes(id, semester, section, academic_year, branch:branches(department_id)),
      users!course_class_assignments_faculty_id_fkey(id, full_name, email)
    `)
    .order("created_at", { ascending: false })

  if (classId) {
    query = query.eq("class_id", classId)
  }
  if (courseId) {
    query = query.eq("course_id", courseId)
  }

  // Role based filtering
  if (session.user.role === 'hod') {
    // Filter by department via class -> branch -> department
    // Note: This relies on the join. If filtering by class_id, we can check that class.
    // But for general list, we need to filter the results or use !inner join.
    // Using !inner on classes to filter by department
    query = supabase
      .from("course_class_assignments")
      .select(`
        *,
        courses(id, course_code, course_name, semester),
        classes!inner(id, semester, section, academic_year, branch:branches!inner(department_id)),
        users!course_class_assignments_faculty_id_fkey(id, full_name, email)
      `)
      .eq("classes.branch.department_id", session.user.departmentId)
      .order("created_at", { ascending: false })

    if (classId) query = query.eq("class_id", classId)
    if (courseId) query = query.eq("course_id", courseId)
  } else if (session.user.role === 'faculty') {
    query = query.eq("faculty_id", session.user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === 'faculty') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = await createClient()
  const body = await req.json()

  // If HOD, verify class belongs to department
  if (session.user.role === 'hod') {
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        branch:branches (
          department_id
        )
      `)
      .eq('id', body.class_id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: "Invalid class" }, { status: 400 })
    }

    // @ts-ignore
    if (classData.branch?.department_id !== session.user.departmentId) {
      return NextResponse.json({ error: "Forbidden: You can only assign courses for your department" }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from("course_class_assignments")
    .insert([body])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
