import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: branches, error } = await supabase
      .from("branches")
      .select("id, name, code")
      .order("name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ branches })
  } catch {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
  }
}
