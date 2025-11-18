import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = context.params

    const { error } = await supabase.from("classes").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
