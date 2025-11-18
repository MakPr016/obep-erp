import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = context.params

    const { data, error } = await supabase
      .from("students")
      .select(`
        *,
        class:classes (
          id,
          branch_id,
          semester,
          section,
          academic_year
        )
      `)
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch student" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = context.params
    const body = await req.json()

    const { data, error } = await supabase
      .from("students")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = context.params

    const { error } = await supabase
      .from("students")
      .update({ is_active: false })
      .eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete student" }, { status: 500 })
  }
}
