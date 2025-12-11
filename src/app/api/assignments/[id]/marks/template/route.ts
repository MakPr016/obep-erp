import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("class_id, title, total_marks")
    .eq("id", id)
    .single()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  // Fetch students for the class
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("usn, name")
    .eq("class_id", assignment.class_id)
    .eq("is_active", true)
    .order("usn")

  if (studentsError) {
    return NextResponse.json(
      { error: studentsError.message },
      { status: 500 }
    )
  }

  // Generate CSV content
  const headers = ["USN", "Name", "Marks"]
  const rows = students.map(s => [s.usn, s.name, ""])
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n")

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="assignment_${id}_marks_template.csv"`,
    },
  })
}
