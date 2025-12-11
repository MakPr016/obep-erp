import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === 'faculty') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = await createClient()
  const body = await request.json()
  const { facultyData } = body

  if (!Array.isArray(facultyData)) {
    return NextResponse.json(
      { error: "Invalid data format. Expected 'facultyData' array." },
      { status: 400 }
    )
  }

  if (facultyData.length === 0) {
    return NextResponse.json(
      { error: "No data provided" },
      { status: 400 }
    )
  }

  // Validate CSV headers
  const firstRow = facultyData[0]
  const expectedHeaders = ["Full Name", "Email", "Password"]
  const receivedHeaders = Object.keys(firstRow)

  const hasRequiredHeaders = ["Full Name", "Email"].every(h => 
    receivedHeaders.some(r => r.trim().toLowerCase() === h.toLowerCase())
  )

  if (!hasRequiredHeaders) {
    return NextResponse.json(
      {
        error: "Invalid CSV format. Required columns: Full Name, Email. Optional: Password",
        debug: {
          expected: expectedHeaders,
          received: receivedHeaders,
        },
      },
      { status: 400 }
    )
  }

  const facultyToInsert: Array<{
    full_name: string
    email: string
    password_hash: string
    role: string
    department_id: string | null
    is_active: boolean
  }> = []

  const errors: string[] = []
  const emailSet = new Set<string>()

  // Check existing emails in database
  const { data: existingUsers } = await supabase
    .from("users")
    .select("email")
    .eq("role", "faculty")

  const existingEmails = new Set(existingUsers?.map(u => u.email.toLowerCase()) || [])

  for (let i = 0; i < facultyData.length; i++) {
    const row = facultyData[i]
    const fullName = (row["Full Name"] || row["full name"] || row["full_name"] || "").toString().trim()
    const email = (row["Email"] || row["email"] || "").toString().trim().toLowerCase()
    const password = (row["Password"] || row["password"] || "").toString().trim()

    if (!fullName) {
      errors.push(`Row ${i + 1}: Missing Full Name`)
      continue
    }

    if (!email) {
      errors.push(`Row ${i + 1}: Missing Email`)
      continue
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push(`Row ${i + 1}: Invalid email format "${email}"`)
      continue
    }

    // Check for duplicate emails in CSV
    if (emailSet.has(email)) {
      errors.push(`Row ${i + 1}: Duplicate email "${email}" in CSV`)
      continue
    }

    // Check if email already exists in database
    if (existingEmails.has(email)) {
      errors.push(`Row ${i + 1}: Email "${email}" already exists in database`)
      continue
    }

    emailSet.add(email)

    // Generate password if not provided
    const finalPassword = password || `Faculty@${Math.random().toString(36).slice(-8)}`
    const hashedPassword = await bcrypt.hash(finalPassword, 10)

    let departmentId: string | null = null
    if (session.user.role === 'hod' && session.user.departmentId) {
      departmentId = session.user.departmentId
    }

    facultyToInsert.push({
      full_name: fullName,
      email: email,
      password_hash: hashedPassword,
      role: "faculty",
      department_id: departmentId,
      is_active: true,
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

  if (facultyToInsert.length === 0) {
    return NextResponse.json(
      { error: "No valid faculty data to import" },
      { status: 400 }
    )
  }

  // Insert faculty records
  const { error: insertError } = await supabase
    .from("users")
    .insert(facultyToInsert)

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    facultyCount: facultyToInsert.length,
  })
}
