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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await context.params
    const supabase = await createClient()

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single()

    if (courseError || !course) {
      console.error("GET course error:", courseError)
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Fetch branch info
    const { data: branch } = await supabase
      .from("branches")
      .select("branch_name, branch_code")
      .eq("id", course.branch_id)
      .single()

    // Fetch department info
    const { data: department } = await supabase
      .from("departments")
      .select("department_name, department_code")
      .eq("id", course.department_id)
      .single()

    // Fetch course outcomes
    const { data: courseOutcomes, error: coError } = await supabase
      .from("course_outcomes")
      .select("id, co_number, description, blooms_level")
      .eq("course_id", courseId)
      .order("co_number")

    if (coError) {
      console.error("GET course_outcomes error:", coError)
      return NextResponse.json({ error: coError.message }, { status: 500 })
    }

    // Fetch CO-PO mappings
    const coIds = courseOutcomes?.map(co => co.id) || []
    let coPoMappings: any[] = []
    if (coIds.length > 0) {
      const { data: mappings } = await supabase
        .from("co_po_mappings")
        .select("course_outcome_id, program_outcome_id, mapping_strength")
        .in("course_outcome_id", coIds)
      coPoMappings = mappings || []
    }

    // Build program outcome map from mapped IDs
    const poIds = [...new Set(coPoMappings.map(m => m.program_outcome_id))]
    let programOutcomesMap: Record<string, any> = {}
    if (poIds.length > 0) {
      const { data: pos } = await supabase
        .from("program_outcomes")
        .select("id, po_number, description")
        .in("id", poIds)
      if (pos) {
        pos.forEach(po => {
          programOutcomesMap[po.id] = po
        })
      }
    }

    // Fetch all program outcomes for course branch
    const { data: allProgramOutcomes, error: poError } = await supabase
      .from("program_outcomes")
      .select("id, po_number, description")
      .eq("branch_id", course.branch_id)
      .order("po_number")

    if (poError) {
      console.error("GET program_outcomes error:", poError)
      return NextResponse.json({ error: poError.message }, { status: 500 })
    }

    // Enrich COs with their mappings for frontend convenience
    const enrichedCourseOutcomes = courseOutcomes?.map(co => {
      const mappings = coPoMappings
        .filter(m => m.course_outcome_id === co.id)
        .map(m => ({
          mapping_strength: m.mapping_strength,
          program_outcome: programOutcomesMap[m.program_outcome_id]
        }))
        .filter(m => m.program_outcome)

      return {
        ...co,
        co_po_mappings: mappings
      }
    })

    return NextResponse.json({
      course: {
        ...course,
        branch_name: branch?.branch_name,
        branch_code: branch?.branch_code,
        department_name: department?.department_name,
        department_code: department?.department_code,
      },
      courseOutcomes: enrichedCourseOutcomes || [],
      programOutcomes: allProgramOutcomes || []
    })
  } catch (error: any) {
    console.error("Unhandled error in GET /cos:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await context.params
    const { results } = await req.json()
    const supabase = await createClient()

    if (!Array.isArray(results)) {
      return NextResponse.json({ error: "Missing or invalid data" }, { status: 400 })
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("branch_id")
      .eq("id", courseId)
      .single()

    if (courseError || !course?.branch_id) {
      console.error("GET course error:", courseError)
      return NextResponse.json({ error: "Invalid course or missing branch" }, { status: 400 })
    }

    // Since frontend sends UUIDs, fetch program outcomes just for validation / logging (optional)
    const { data: poList, error: poListError } = await supabase
      .from("program_outcomes")
      .select("id, po_number")
      .eq("branch_id", course.branch_id)

    if (poListError) {
      console.error("Fetch program_outcomes error:", poListError)
      return NextResponse.json({ error: poListError.message }, { status: 500 })
    }

    // Create a set of valid UUIDs for quick validation (optional)
    const validPoIds = new Set(poList?.map(po => po.id) || [])

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

        const program_outcome_id = mapping.po_id

        if (!validPoIds.has(program_outcome_id)) {
          console.error("Invalid mapping PO UUID", program_outcome_id)
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
