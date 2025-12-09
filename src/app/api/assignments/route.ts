import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    // For now, return empty list instead of 401 so UI doesn't explode
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  // Very simple query: later you can add role filters
  const { data, error } = await supabase
    .from("assignments")
    .select(
      `
      id,
      title,
      total_marks,
      status,
      due_date,
      course_id,
      branch_id,
      academic_year,
      semester,
      courses:course_id (course_code, course_name),
      branches:branch_id (name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("assignments GET error", error.message);
    // For now, return [] so frontend just shows "No assignments yet"
    return NextResponse.json([]);
  }

  const mapped = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    status: row.status ?? "DRAFT",
    totalMarks: row.total_marks ?? 100,
    dueDate: row.due_date,
    academicYear: row.academic_year,
    semester: row.semester,
    courseCode: row.courses?.course_code ?? "",
    courseName: row.courses?.course_name ?? "",
    branchName: row.branches?.name ?? "",
  }));

  return NextResponse.json(mapped);
}
