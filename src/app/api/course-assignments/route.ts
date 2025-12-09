import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const userRole = session.user.role;
  const userDepartmentId = session.user.departmentId;
  const userId = session.user.id;

  let query = supabase
    .from('course_class_assignments')
    .select(`
      *,
      courses(id, course_code, course_name, semester, branch_id),
      classes(id, semester, section, academic_year, branch_id, branches(id, name, code, department_id)),
      users!course_class_assignments_faculty_id_fkey(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (userRole === 'admin' || userRole === 'super_admin') {
    // no filter for admin
  } else if (userRole === 'hod') {
    const { data: departmentBranches, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('department_id', userDepartmentId);
    if (branchError) {
      return NextResponse.json({ error: branchError.message }, { status: 500 });
    }
    const branchIds = (departmentBranches ?? []).map((b: { id: string }) => b.id);
    if (branchIds.length > 0) {
      const { data: departmentClasses, error: classError } = await supabase
        .from('classes')
        .select('id')
        .in('branch_id', branchIds);
      if (classError) {
        return NextResponse.json({ error: classError.message }, { status: 500 });
      }
      const classIds = (departmentClasses ?? []).map((c: { id: string }) => c.id);
      if (classIds.length > 0) {
        query = query.in('class_id', classIds);
      } else {
        return NextResponse.json({ data: [] });
      }
    } else {
      return NextResponse.json({ data: [] });
    }
  } else if (userRole === 'faculty') {
    query = query.eq('faculty_id', userId);
  } else {
    return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}
