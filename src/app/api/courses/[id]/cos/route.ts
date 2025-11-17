// src/app/api/courses/[id]/cos/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await context.params
  const { results } = await req.json()
  const supabase = await createClient()
  if (!Array.isArray(results)) return NextResponse.json({ error: "Missing data" }, { status: 400 })
  for (let i = 0; i < results.length; i++) {
    const co = results[i]
    const { data } = await supabase
      .from("course_outcomes")
      .upsert({
        course_id: courseId,
        co_number: `CO${i + 1}`,
        description: co.co_text,
        blooms_level: co.bloom_prediction?.predicted_level || null,
      }, { onConflict: "course_id,co_number" }).select().single()
    if (data && Array.isArray(co.mappings)) {
      for (const mapping of co.mappings) {
        await supabase
          .from("co_po_mappings")
          .upsert({
            course_outcome_id: data.id,
            program_outcome_id: mapping.po_id,
            mapping_strength: mapping.strength,
          }, { onConflict: "course_outcome_id,program_outcome_id" })
      }
    }
  }
  return NextResponse.json({ ok: true })
}
