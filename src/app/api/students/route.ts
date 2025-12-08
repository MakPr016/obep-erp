import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 20
    const classId = searchParams.get("classid") || undefined
    const offset = (page - 1) * limit

    let query = supabase
      .from("students")
      .select(
        `
      *,
      class:classes (
        id,
        branch_id,
        semester,
        section,
        academic_year,
        branch:branches (
          department_id
        )
      )
    `,
        { count: "exact" }
      )
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1)

    if (classId) {
      query = query.eq("class_id", classId)
    }

    // If HOD, filter by department
    if (session.user.role === 'hod') {
      query = query.eq("class.branch.department_id", session.user.departmentId)
    } else if (session.user.role === 'faculty') {
      // Get classes assigned to this faculty
      const { data: assignments } = await supabase
        .from('course_class_assignments')
        .select('class_id')
        .eq('faculty_id', session.user.id);

      const classIds = assignments?.map(a => a.class_id) || [];

      if (classIds.length === 0) {
        // Return empty if no classes assigned
        return NextResponse.json({
          students: [],
          pagination: { page, limit, totalpages: 0 }
        });
      }

      query = query.in('class_id', classIds);
    }

    const { data: students, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      students: students || [],
      pagination: {
        page,
        limit,
        totalpages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === 'faculty') {
      return NextResponse.json({ error: "Forbidden: Faculty cannot create students" }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await req.json()

    if (!body.usn || !body.name || !body.class_id) {
      return NextResponse.json({ error: "Missing required fields: usn, name, class_id" }, { status: 400 })
    }

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
        return NextResponse.json({ error: "Forbidden: You can only create students for your department" }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from("students")
      .insert(body)
      .select()
      .single()

    if (error) throw error

    // Update class total_students count
    const { data: classData } = await supabase
      .from("classes")
      .select("total_students")
      .eq("id", body.class_id)
      .single()

    if (classData) {
      await supabase
        .from("classes")
        .update({ total_students: (classData.total_students || 0) + 1 })
        .eq("id", body.class_id)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add student" }, { status: 500 })
  }
}
