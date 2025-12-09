// src/app/api/course-class-assignments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/auth"

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === 'faculty') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = await createClient()
  const { id } = await context.params

  // If HOD, verify assignment belongs to department
  if (session.user.role === 'hod') {
    const { data: assignment, error: assignError } = await supabase
      .from('course_class_assignments')
      .select(`
        classes (
          branch:branches (
            department_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (assignError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // @ts-ignore
    if (assignment.classes?.branch?.department_id !== session.user.departmentId) {
      return NextResponse.json({ error: "Forbidden: You can only delete assignments in your department" }, { status: 403 })
    }
  }

  const { error } = await supabase
    .from("course_class_assignments")
    .delete()
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
