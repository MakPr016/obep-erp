// src/app/api/faculty/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from 'bcryptjs'
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === 'faculty') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = await createClient()
  let query = supabase
    .from("users")
    .select("id, full_name, email, department_id")
    .eq("role", "faculty")
    .eq("is_active", true)
    .order("full_name")

  if (session.user.role === 'hod') {
    query = query.eq("department_id", session.user.departmentId)
  }

  const { data: faculty, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ faculty: faculty || [] })
}

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
    if (!body.full_name || !body.email || !body.password) {
      return NextResponse.json({ error: "full_name, email, and password are required" }, { status: 400 })
    }

    // If HOD, force department_id
    if (session.user.role === 'hod') {
      body.department_id = session.user.departmentId
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          full_name: body.full_name,
          email: body.email,
          password_hash: hashedPassword,
          role: "faculty",
          department_id: body.department_id || null,
          is_active: true
        }
      ])
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}