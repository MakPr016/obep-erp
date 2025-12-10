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
  const user = session.user;
  const { searchParams } = new URL(req.url);

  const branchIdFilter = searchParams.get("branchId");
  const semesterFilter = searchParams.get("semester");
  const yearFilter = searchParams.get("academicYear");

  let query = supabase
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
      created_by,
      courses:course_id (course_code, course_name),
      branches:branch_id (name, department_id)
    `,
    )
    .order("created_at", { ascending: false });

  // Role-based scoping
  if (user.role === "admin" || user.role === "super_admin") {
    // admin sees all; no extra filter
  } else if (user.role === "hod") {
    // limit to branches in this HOD's department
    query = query.eq("branches.department_id", user.departmentId);
  } else if (user.role === "faculty") {
    // faculty: assignments they created or in courses they teach
    // first, get their course_ids from course_class_assignments
    const { data: cca, error: ccaError } = await supabase
      .from("course_class_assignments")
      .select("course_id")
      .eq("faculty_id", user.id);

    if (ccaError) {
      console.error("assignments GET cca error", ccaError.message);
      return NextResponse.json([]);
    }

    const courseIds = (cca ?? []).map((c: any) => c.course_id).filter(Boolean);

    // filter: created_by = user OR course_id in their assignments
    if (courseIds.length > 0) {
      query = query.or(
        `created_by.eq.${user.id},course_id.in.(${courseIds.join(",")})`,
      );
    } else {
      query = query.eq("created_by", user.id);
    }
  } else {
    // unknown role: nothing
    return NextResponse.json([]);
  }

  // Optional extra filters for admin/HOD UI
  if (branchIdFilter) {
    query = query.eq("branch_id", branchIdFilter);
  }
  if (semesterFilter) {
    query = query.eq("semester", Number(semesterFilter));
  }
  if (yearFilter) {
    query = query.eq("academic_year", yearFilter);
  }

  const { data, error } = await query;

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
    courseId: row.course_id, // add this
    branchId: row.branch_id, // and this
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

  // strict: these must be present
  if (!courseId || !branchId || !academicYear || !semester) {
    return NextResponse.json(
      { error: "courseId, branchId, academicYear, and semester are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert([
      {
        title,
        description,
        total_marks: totalMarks ?? 100,
        status: status ?? "DRAFT",
        due_date: dueDate,
        blooms_level: bloomLevel ?? null,
        daves_level: daveLevel ?? null,
        course_id: courseId,
        branch_id: branchId,
        academic_year: academicYear,
        semester,
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
