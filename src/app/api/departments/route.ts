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
        const { data: departments, error } = await supabase
            .from("departments")
            .select("id, name, code")
            .order("name")

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ departments })
    } catch {
        return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
    }
}
