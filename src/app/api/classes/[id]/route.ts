import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await context.params
  const { data, error } = await supabase
    .from("classes")
    .select(`
      *,
      branch:branches(id, name, code)
    `)
    .eq("id", id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
