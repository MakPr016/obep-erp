// src/app/api/course-class-assignments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = context.params
  const { error } = await supabase
    .from("course_class_assignments")
    .delete()
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
