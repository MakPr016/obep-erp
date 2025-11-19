import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const schemeId = url.searchParams.get("schemeId")

    const supabase = await createClient()

    let branchQuery = supabase
      .from("branches")
      .select(`
        id,
        name,
        code,
        department_id,
        departments (
          id,
          name,
          code
        )
      `)
      .order("name")

    if (schemeId) {
      branchQuery = branchQuery.eq("scheme_id", schemeId)
    }
    if (session.user.role === "hod") {
      branchQuery = branchQuery.eq("department_id", session.user.departmentId)
    }

    const { data: branches } = await branchQuery

    const transformedBranches = branches?.map(b => {
      const dept = Array.isArray(b.departments) ? b.departments[0] : b.departments
      return {
        id: b.id,
        name: b.name,
        code: b.code,
        department_id: b.department_id,
        department_name: dept?.name || '',
        department_code: dept?.code || '',
      }
    }) || []

    const semesters = Array.from({ length: 8 }, (_, i) => ({
      value: i + 1,
      label: `Semester ${i + 1}`,
    }))

    const { data: courseTypesData } = await supabase
      .from("courses")
      .select("course_type")
      .order("course_type")

    const uniqueTypes = [...new Set(courseTypesData?.map(c => c.course_type) || [])]
    const courseTypes = uniqueTypes.map(type => ({
      value: type,
      label: type,
    }))

    const { data: schemes, error: schemesError } = await supabase
      .from("schemes")
      .select("id, name, year")
      .eq("is_active", true)
      .order("year", { ascending: false })

    if (schemesError) {
      return NextResponse.json({ error: schemesError.message }, { status: 500 })
    }

    return NextResponse.json({
      branches: transformedBranches,
      semesters,
      courseTypes,
      schemes: schemes || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    )
  }
}
