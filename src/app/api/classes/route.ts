// src/app/api/classes/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchid")
    let query = supabase
      .from("classes")
      .select(`
        *,
        branch:branches (
          id,
          name,
          code
        )
      `)
      .order("semester")
      .order("section")
    if (branchId) {
      query = query.eq("branch_id", branchId)
    }
    const { data: classes, error } = await query
    if (error) throw error
    return NextResponse.json({ classes: classes || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { data, error } = await supabase
      .from("classes")
      .insert([body])
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
