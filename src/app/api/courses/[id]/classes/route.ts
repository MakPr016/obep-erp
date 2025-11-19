import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/courses/[id]/classes
 * Fetch all classes (course-class assignments) for a specific course
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Fetch all course-class assignments for this course
        const { data: assignments, error } = await supabase
            .from('course_class_assignments')
            .select(`
        id,
        academic_year,
        classes(
          id,
          semester,
          section,
          academic_year,
          total_students,
          branches(name)
        ),
        users(full_name)
      `)
            .eq('course_id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform the data for easier consumption
        const classes = assignments?.map(assignment => {
            const classData = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes;
            const branchData = Array.isArray(classData?.branches) ? classData.branches[0] : classData?.branches;
            const userData = Array.isArray(assignment.users) ? assignment.users[0] : assignment.users;

            return {
                id: assignment.id, // This is the course_class_assignment_id
                class_id: classData?.id,
                semester: classData?.semester,
                section: classData?.section,
                academic_year: classData?.academic_year || assignment.academic_year,
                branch_name: branchData?.name || 'N/A',
                faculty_name: userData?.full_name || 'N/A',
                student_count: classData?.total_students || 0
            };
        }) || [];

        return NextResponse.json({ classes });
    } catch (error: any) {
        console.error('Error fetching course classes:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
