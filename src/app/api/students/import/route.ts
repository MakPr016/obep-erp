import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    if (!Array.isArray(body.students) || body.students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 })
    }

    const { data: classes, error: classError } = await supabase
      .from("classes")
      .select("id, code")

    if (classError) throw classError

    const mappedStudents = body.students.map((s: any) => {
      const cls = classes.find(c => c.code === s.class_name)
      return {
        ...s,
        class_id: cls?.id || null,
        is_active: typeof s.is_active === "string"
          ? s.is_active.toLowerCase() === "true"
          : !!s.is_active,
      }
    })

    const validStudents = mappedStudents.filter((s: any) => s.class_id !== null)

    if (validStudents.length === 0) {
      return NextResponse.json({ error: "No valid students with matching class_name found" }, { status: 400 })
    }

    const { error } = await supabase
      .from("students")
      .upsert(validStudents, { onConflict: "usn" })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to import students" }, { status: 500 })
  }
}
