import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await context.params
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      branch:branches(id, name, code)
    `)
    .eq("id", id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

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

  // If HOD, verify class belongs to department
  if (session.user.role === 'hod') {
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        branch:branches (
          department_id
        )
      `)
      .eq('id', id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // @ts-ignore
    if (classData.branch?.department_id !== session.user.departmentId) {
      return NextResponse.json({ error: "Forbidden: You can only delete classes in your department" }, { status: 403 })
    }
  }

  // First delete all students in this class
  const { error: studentsError } = await supabase
    .from("students")
    .delete()
    .eq("class_id", id)

  if (studentsError) {
    return NextResponse.json({ error: "Failed to delete students in class" }, { status: 500 })
  }

  // Then delete the class itself
  const { error: classError } = await supabase
    .from("classes")
    .delete()
    .eq("id", id)

  if (classError) {
    return NextResponse.json({ error: classError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
