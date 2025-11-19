import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
  const supabase = await createClient()
  const { id } = await context.params

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
