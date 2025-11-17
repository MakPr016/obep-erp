// src/app/api/courses/[id]/cos/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const bloomToEnumMap: Record<string, string> = {
  Remember: "CL1",
  Understand: "CL2",
  Apply: "CL3",
  Analyze: "CL4",
  Evaluate: "CL5",
  Create: "CL6",
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await context.params
    const { results } = await req.json()
    const supabase = await createClient()
    if (!Array.isArray(results)) return NextResponse.json({ error: "Missing data" }, { status: 400 })

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("branch_id")
      .eq("id", courseId)
      .single()
    if (courseError) {
      console.error("GET course error:", courseError)
      return NextResponse.json({ error: "Invalid course/branch" }, { status: 400 })
    }
    if (!course || !course.branch_id) return NextResponse.json({ error: "Invalid course/branch" }, { status: 400 })

    const { data: poList, error: poListError } = await supabase
      .from("program_outcomes")
      .select("id, po_number")
      .eq("branch_id", course.branch_id)
    if (poListError) {
      console.error("Fetch program_outcomes error:", poListError)
      return NextResponse.json({ error: poListError.message }, { status: 500 })
    }

    const poMap: Record<string, string> = {}
    if (poList) for (const po of poList) poMap[po.po_number] = po.id

    for (let i = 0; i < results.length; i++) {
      const co = results[i]
      const blooms_level =
        co.bloom_prediction && bloomToEnumMap[co.bloom_prediction.predicted_level]
          ? bloomToEnumMap[co.bloom_prediction.predicted_level]
          : "CL1"

      const { data: coRow, error: coErr } = await supabase
        .from("course_outcomes")
        .upsert(
          {
            course_id: courseId,
            co_number: `CO${i + 1}`,
            description: co.co_text,
            blooms_level,
          },
          { onConflict: "course_id,co_number" }
        )
        .select()
        .single()
      if (coErr || !coRow) {
        console.error("Course_outcomes upsert error:", coErr)
        return NextResponse.json({ error: `CO save error: ${coErr?.message}` }, { status: 500 })
      }

      for (const mapping of co.mappings) {
        if (!mapping.strength || mapping.strength < 1 || mapping.strength > 3) continue

        const program_outcome_id = poMap[mapping.po_id]
        if (!program_outcome_id) {
          console.error("Invalid mapping PO number", mapping.po_id)
          continue
        }
        const { error: mappingErr } = await supabase
          .from("co_po_mappings")
          .upsert(
            {
              course_outcome_id: coRow.id,
              program_outcome_id,
              mapping_strength: mapping.strength,
            },
            { onConflict: "course_outcome_id,program_outcome_id" }
          )
        if (mappingErr) {
          console.error("Mapping upsert error:", mappingErr)
          return NextResponse.json({ error: `Mapping error: ${mappingErr.message}` }, { status: 500 })
        }
      }

    }
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Unhandled error in POST /cos:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
