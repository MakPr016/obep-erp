import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { studentIds, action } = await req.json()

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return NextResponse.json({ error: "No students selected" }, { status: 400 })
        }

        if (!["activate", "deactivate"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        const isActive = action === "activate"

        const { error } = await supabase
            .from("students")
            .update({ is_active: isActive })
            .in("id", studentIds)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to perform bulk action" }, { status: 500 })
    }
}
