// src/app/api/faculty/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from 'bcryptjs'

export async function GET() {
  const supabase = await createClient()
  const { data: faculty, error } = await supabase
    .from("users")
    .select("id, full_name, email, department_id")
    .eq("role", "faculty")
    .eq("is_active", true)
    .order("full_name")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ faculty: faculty || [] })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    if (!body.full_name || !body.email || !body.password) {
      return NextResponse.json({ error: "full_name, email, and password are required" }, { status: 400 })
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
  } catch(error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}