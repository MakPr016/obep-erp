import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: schemes, error } = await supabase
      .from("schemes")
      .select("id, name, year")
      .eq("is_active", true)
      .order("year", { ascending: false })

    if (error) throw error

    return NextResponse.json({ schemes: schemes || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
