import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("branch_id, semester, academic_year")
    .eq("id", id)
    .single()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, section, total_students")
    .eq("branch_id", assignment.branch_id)
    .eq("semester", assignment.semester)
    .eq("academic_year", assignment.academic_year)
    .order("section")

  if (classesError) {
    return NextResponse.json({ error: classesError.message }, { status: 500 })
  }

  return NextResponse.json({ classes })
}
