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
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select(`
        *,
        branch:branches (
          id,
          name,
          code,
          department:departments (
            id,
            name,
            code
          ),
          scheme:schemes (
            name,
            year
          )
        )
      `)
      .eq("id", courseId)
      .single()
    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    const departmentId = course.branch?.department?.id
    if (session.user.role === "hod") {
      if (departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (session.user.role === "faculty") {
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
      scheme_year: course.branch?.scheme?.year,
    }
    return NextResponse.json({ course: transformedCourse })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch course details" },
      { status: 500 }
    )
  }
}
