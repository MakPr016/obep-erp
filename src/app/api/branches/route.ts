import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")
    const schemeId = searchParams.get("schemeId")

    const supabase = await createClient()
    let query = supabase
      .from("branches")
      .select(`
        id,
        name,
        code,
        scheme_id,
        department_id,
        scheme:schemes(name, year),
        department:departments(name)
      `)
      .order("name")

    if (departmentId) {
      query = query.eq("department_id", departmentId)
    }

    if (schemeId) {
      query = query.eq("scheme_id", schemeId)
    }

    const { data: branches, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ branches })
  } catch {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, department_id, scheme_id } = body

    if (!name || !code || !department_id || !scheme_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("branches")
      .insert({ name, code, department_id, scheme_id })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ branch: data })
  } catch {
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 })
  }
}
