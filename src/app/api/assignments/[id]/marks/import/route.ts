import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  const { marksData } = body

  if (!Array.isArray(marksData)) {
    return NextResponse.json(
      { error: "Invalid data format. Expected 'marksData' array." },
      { status: 400 }
    )
  }

  if (marksData.length === 0) {
    return NextResponse.json(
      { error: "No data provided" },
      { status: 400 }
    )
  }

  // Validate CSV headers
  const firstRow = marksData[0]
  const expectedHeaders = ["USN", "Name", "Marks"]
  const receivedHeaders = Object.keys(firstRow)

  const hasRequiredHeaders = expectedHeaders.every(h => 
    receivedHeaders.some(r => r.trim().toLowerCase() === h.toLowerCase())
  )

  if (!hasRequiredHeaders) {
    return NextResponse.json(
      {
        error: "Invalid CSV format. Required columns: USN, Name, Marks",
        debug: {
          expected: expectedHeaders,
          received: receivedHeaders,
        },
      },
      { status: 400 }
    )
  }

  // Fetch assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("class_id, total_marks")
    .eq("id", id)
    .single()

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    )
  }

  // Fetch all students in the class to create USN -> student_id mapping
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, usn")
    .eq("class_id", assignment.class_id)
    .eq("is_active", true)

  if (studentsError) {
    return NextResponse.json(
      { error: studentsError.message },
      { status: 500 }
    )
  }

  const usnToStudentId = new Map<string, string>()
  students.forEach(s => {
    usnToStudentId.set(s.usn.toLowerCase().trim(), s.id)
  })

  // Parse and validate marks data
  const marksToInsert: Array<{
    assignment_id: string
    class_id: string
    student_id: string
    marks_obtained: number
    updated_at: string
  }> = []

  const errors: string[] = []

  for (let i = 0; i < marksData.length; i++) {
    const row = marksData[i]
    const usn = (row.USN || row.usn || "").toString().trim()
    const marksStr = (row.Marks || row.marks || "").toString().trim()

    if (!usn) {
      errors.push(`Row ${i + 1}: Missing USN`)
      continue
    }

    const studentId = usnToStudentId.get(usn.toLowerCase())
    if (!studentId) {
      errors.push(`Row ${i + 1}: Student with USN "${usn}" not found in class`)
      continue
    }

    // Skip if marks is empty (allows partial uploads)
    if (marksStr === "") {
      continue
    }

    const marks = parseFloat(marksStr)
    if (isNaN(marks)) {
      errors.push(`Row ${i + 1}: Invalid marks value "${marksStr}"`)
      continue
    }

    if (marks < 0) {
      errors.push(`Row ${i + 1}: Marks cannot be negative`)
      continue
    }

    if (marks > assignment.total_marks) {
      errors.push(`Row ${i + 1}: Marks ${marks} exceeds maximum ${assignment.total_marks}`)
      continue
    }

    marksToInsert.push({
      assignment_id: id,
      class_id: assignment.class_id,
      student_id: studentId,
      marks_obtained: marks,
      updated_at: new Date().toISOString(),
    })
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: "Data validation failed",
        details: errors.join("\n"),
      },
      { status: 400 }
    )
  }

  if (marksToInsert.length === 0) {
    return NextResponse.json(
      { error: "No valid marks data to import" },
      { status: 400 }
    )
  }

  // Insert marks using upsert
  const { error: insertError } = await supabase
    .from("assignment_student_marks")
    .upsert(marksToInsert, {
      onConflict: "assignment_id,student_id",
    })

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    studentsCount: marksToInsert.length,
  })
}
