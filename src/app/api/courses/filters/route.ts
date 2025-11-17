import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createClient } from "@/lib/supabase/server"

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get branches with department info
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

    // Filter by department for HODs
    if (session.user.role === "hod") {
      branchQuery = branchQuery.eq("department_id", session.user.departmentId)
    }

    const { data: branches } = await branchQuery

    // Transform branches data - department comes as a single object, not array
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

    // Semesters 1-8
    const semesters = Array.from({ length: 8 }, (_, i) => ({
      value: i + 1,
      label: `Semester ${i + 1}`,
    }))

    // Get unique course types
    const { data: courseTypesData } = await supabase
      .from("courses")
      .select("course_type")
      .order("course_type")

    const uniqueTypes = [...new Set(courseTypesData?.map(c => c.course_type) || [])]
    const courseTypes = uniqueTypes.map(type => ({
      value: type,
      label: type,
    }))

    return NextResponse.json({
      branches: transformedBranches,
      semesters,
      courseTypes,
    })
  } catch (error) {
    console.error("Error fetching filters:", error)
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    )
  }
}
