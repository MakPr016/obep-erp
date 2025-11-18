import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    if (body.usn && body.name && body.class_id) {
      const { data, error } = await supabase
        .from("students")
        .insert([body])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    if (!Array.isArray(body.students) || body.students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 })
    }

    const { error } = await supabase
      .from("students")
      .upsert(body.students, { onConflict: "usn" })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save student(s)" }, { status: 500 })
  }
}
