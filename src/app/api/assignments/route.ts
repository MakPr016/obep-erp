// src/app/api/assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await req.json();

  const {
    title,
    description,
    totalMarks,
    status,
    dueDate,
    bloomLevel,
    daveLevel,
    courseId,
    branchId,
    academicYear,
    semester,
  } = body;

  const { data, error } = await supabase
    .from("assignments")
    .insert([
      {
        title,
        description,
        total_marks: totalMarks ?? 100,
        status: status ?? "DRAFT",
        due_date: dueDate,
        blooms_level: bloomLevel ?? null, // adjust column names
        daves_level: daveLevel ?? null,
        course_id: courseId ?? null,
        branch_id: branchId ?? null,
        academic_year: academicYear ?? null,
        semester: semester ?? null,
        created_by: session.user.id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("assignments POST error", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
