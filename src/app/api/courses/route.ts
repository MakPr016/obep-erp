import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const semester = searchParams.get("semester")
    const courseType = searchParams.get("courseType")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase
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
        ),
        course_outcomes (count)
      `, { count: 'exact' })

    if (session.user.role === "hod") {
      query = query.eq("branch.department.id", session.user.departmentId)
    } else if (session.user.role === "faculty") {
      const { data: assignedCourses } = await supabase
        .from("course_class_assignments")
        .select("course_id")
        .eq("faculty_id", session.user.id)
      
      const courseIds = assignedCourses?.map(a => a.course_id) || []
      
      if (courseIds.length === 0) {
        return NextResponse.json({
          courses: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
      
      query = query.in("id", courseIds)
    }

    if (branchId) {
      query = query.eq("branch_id", branchId)
    }

    if (semester) {
      query = query.eq("semester", parseInt(semester))
    }

    if (courseType) {
      query = query.eq("course_type", courseType)
    }

    if (search) {
      query = query.or(
        `course_code.ilike.%${search}%,course_name.ilike.%${search}%,nba_code.ilike.%${search}%`
      )
    }

    const { data: courses, error, count } = await query
      .order("semester")
      .order("course_code")
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      )
    }

    const transformedCourses = courses?.map(course => ({
      id: course.id,
      course_code: course.course_code,
      course_name: course.course_name,
      nba_code: course.nba_code,
      semester: course.semester,
      course_type: course.course_type,
      set_target_percentage: course.set_target_percentage,
      class_target_percentage: course.class_target_percentage,
      branch_id: course.branch_id,
      branch_name: course.branch?.name,
      branch_code: course.branch?.code,
      department_id: course.branch?.department?.id,
      department_name: course.branch?.department?.name,
      department_code: course.branch?.department?.code,
      scheme_name: course.branch?.scheme?.name,
      co_count: course.course_outcomes?.[0]?.count || 0,
    })) || []

    return NextResponse.json({
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const payload = await request.json()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("courses")
      .insert(payload)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ course: data })
  } catch {
    return NextResponse.json({ error: "Failed to add course" }, { status: 500 })
  }
}
