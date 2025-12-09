// src/app/api/classes/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
          code,
          department_id
        )
      `)
      .order("semester")
      .order("section")

    if (branchId) {
      query = query.eq("branch_id", branchId)
    }

    // If HOD, filter by department
    if (session.user.role === 'hod') {
      query = query.eq("branch.department_id", session.user.departmentId)
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
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === 'faculty') {
      return NextResponse.json({ error: "Forbidden: Faculty cannot create classes" }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await req.json()

    // If HOD, verify branch belongs to department
    if (session.user.role === 'hod') {
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('department_id')
        .eq('id', body.branch_id)
        .single()

      if (branchError || !branch) {
        return NextResponse.json({ error: "Invalid branch" }, { status: 400 })
      }

      if (branch.department_id !== session.user.departmentId) {
        return NextResponse.json({ error: "Forbidden: You can only create classes for your department" }, { status: 403 })
      }
    }

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
