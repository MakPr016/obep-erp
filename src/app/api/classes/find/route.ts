import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const branch_id = searchParams.get("branch_id")
  const semester = Number(searchParams.get("semester"))
  const section = searchParams.get("section")
  const academic_year = searchParams.get("academic_year")
  if (!branch_id || !semester || !section || !academic_year)
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("branch_id", branch_id)
    .eq("semester", semester)
    .eq("section", section)
    .eq("academic_year", academic_year)
    .maybeSingle()
  if (error || !data) return NextResponse.json({}, { status: 200 })
  return NextResponse.json(data)
}
