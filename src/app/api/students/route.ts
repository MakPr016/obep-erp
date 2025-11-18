import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 20
    const classId = searchParams.get("classid") || undefined
    const offset = (page - 1) * limit

    let query = supabase
      .from("students")
      .select(
        `
      *,
      class:classes (
        id,
        branch_id,
        semester,
        section,
        academic_year
      )
    `,
        { count: "exact" }
      )
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1)

    if (classId) {
      query = query.eq("class_id", classId)
    }

    const { data: students, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      students: students || [],
      pagination: {
        page,
        limit,
        totalpages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    if (!body.usn || !body.name || !body.class_id) {
      return NextResponse.json({ error: "Missing required fields: usn, name, class_id" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("students")
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add student" }, { status: 500 })
  }
}
