// src/app/api/course-class-assignments/bulk-create/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === 'faculty') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await req.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Payload must be an array" }, { status: 400 })
    }

    // If HOD, verify all assignments belong to department
    if (session.user.role === 'hod') {
      // Check the first item's class_id (assuming all are for the same class as per UI)
      // Or check each one. The UI sends bulk for a single class.
      const classId = body[0]?.class_id
      if (classId) {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select(`
            branch:branches (
              department_id
            )
          `)
          .eq('id', classId)
          .single()

        if (classError || !classData) {
          return NextResponse.json({ error: "Invalid class" }, { status: 400 })
        }

        // @ts-ignore
        if (classData.branch?.department_id !== session.user.departmentId) {
          return NextResponse.json({ error: "Forbidden: You can only create assignments for your department" }, { status: 403 })
        }
      }
    }

    const { data, error } = await supabase
      .from("course_class_assignments")
      .insert(body)
      .select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
