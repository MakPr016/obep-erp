import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id: courseId } = await context.params
    const supabase = await createClient()
    const { data: course } = await supabase
      .from("courses")
      .select(`
        *,
        branch:branches (
          id, name, code,
          department:departments (
            id, name, code
          ),
          scheme:schemes (
            name
          )
        )
      `)
      .eq("id", courseId)
      .single()
    const { data: courseOutcomes } = await supabase
      .from("course_outcomes")
      .select("*")
      .eq("course_id", courseId)
    const departmentId = course?.branch?.department?.id
    if (session.user.role === "hod" && departmentId !== session.user.departmentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (session.user.role === "faculty") {
      const { data: assignment } = await supabase
        .from("course_class_assignments")
        .select("id")
        .eq("course_id", courseId)
        .eq("faculty_id", session.user.id)
        .single()
      if (!assignment) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
    const transformedCourse = {
      ...course,
      branch_name: course.branch?.name,
      branch_code: course.branch?.code,
      department_id: course.branch?.department?.id,
      department_name: course.branch?.department?.name,
      department_code: course.branch?.department?.code,
      scheme_name: course.branch?.scheme?.name,
    }
    return NextResponse.json({ course: transformedCourse, courseOutcomes: courseOutcomes || [] })
  } catch {
    return NextResponse.json({ error: "Failed to fetch course details" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id: courseId } = await context.params
    const payload = await request.json()
    const supabase = await createClient()
    const { error } = await supabase
      .from("courses")
      .update(payload)
      .eq("id", courseId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id: courseId } = await context.params
    const supabase = await createClient()
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}
