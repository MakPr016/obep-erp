import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    if (!Array.isArray(body.students) || body.students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 })
    }

    const studentsWithActiveFlag = body.students.map((s: any) => ({
      ...s,
      is_active: typeof s.is_active === "string" ? s.is_active.toLowerCase() === "true" : !!s.is_active,
    }))

    const { error } = await supabase
      .from("students")
      .upsert(studentsWithActiveFlag, { onConflict: "usn" })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to import students" }, { status: 500 })
  }
}
