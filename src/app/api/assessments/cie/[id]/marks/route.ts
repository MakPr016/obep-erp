// src/app/api/assessments/cie/[id]/marks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/assessments/cie/[id]/marks?assignmentId=xxx
 * Fetch all student marks for a CIE assessment for a specific class
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('assignmentId');

        if (!assignmentId) {
            return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Fetch assessment details
        const { data: assessment, error: assessmentError } = await supabase
            .from('cie_assessments')
            .select(`
        *,
        course_class_assignments(
          courses(id, course_name, course_code)
        )
      `)
            .eq('id', id)
            .single();

        if (assessmentError) {
            return NextResponse.json({ error: assessmentError.message }, { status: 500 });
        }

        if (!assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Fetch the specific course-class assignment to get class details
        const { data: assignment, error: assignmentError } = await supabase
            .from('course_class_assignments')
            .select(`
        id,
        classes(
          id,
          semester,
          section,
          academic_year,
          branches(name)
        )
      `)
            .eq('id', assignmentId)
            .single();

        if (assignmentError || !assignment) {
            return NextResponse.json({ error: 'Class assignment not found' }, { status: 404 });
        }

        // Fetch questions
        const { data: questions, error: questionsError } = await supabase
            .from('cie_questions')
            .select('*')
            .eq('cie_assessment_id', id)
            .order('part_number')
            .order('question_number')
            .order('sub_question_label');

        if (questionsError) {
            return NextResponse.json({ error: questionsError.message }, { status: 500 });
        }

        // Fetch students from the specific class
        const classData = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes;
        const classId = classData?.id;
        if (!classId) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, usn, name')
            .eq('class_id', classId)
            .eq('is_active', true)
            .order('usn');

        if (studentsError) {
            return NextResponse.json({ error: studentsError.message }, { status: 500 });
        }

        // Fetch all marks for this assessment
        const questionIds = questions?.map(q => q.id) || [];
        const { data: marks, error: marksError } = await supabase
            .from('cie_student_marks')
            .select('*')
            .in('cie_question_id', questionIds);

        if (marksError) {
            return NextResponse.json({ error: marksError.message }, { status: 500 });
        }

        // Structure the response
        const studentsWithMarks = students?.map(student => {
            const studentMarks = questions?.map(question => {
                const mark = marks?.find(
                    m => m.student_id === student.id && m.cie_question_id === question.id
                );
                return {
                    question_id: question.id,
                    question_number: question.question_number,
                    sub_question_label: question.sub_question_label,
                    part_number: question.part_number,
                    max_marks: question.max_marks,
                    marks_obtained: mark?.marks_obtained || null
                };
            }) || [];

            const total = studentMarks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);

            return {
                id: student.id,
                usn: student.usn,
                name: student.name,
                marks: studentMarks,
                total
            };
        }) || [];

        // Class information
        const branchData = Array.isArray(classData?.branches) ? classData.branches[0] : classData?.branches;
        const classInfo = {
            semester: classData?.semester,
            section: classData?.section,
            academic_year: classData?.academic_year,
            branch_name: branchData?.name || 'N/A'
        };

        return NextResponse.json({
            assessment,
            classInfo,
            questions,
            students: studentsWithMarks,
            classId: classId // Include classId for use in attainment navigation
        });
    } catch (error: any) {
        console.error('Error fetching CIE marks:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/assessments/cie/[id]/marks
 * Bulk upload/update student marks for CIE assessment
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { marks } = body;

        if (!marks || !Array.isArray(marks)) {
            return NextResponse.json({ error: 'Invalid marks data' }, { status: 400 });
        }

        const supabase = await createClient();

        // Validate that all marks have required fields
        for (const mark of marks) {
            if (!mark.student_id || !mark.question_id || mark.marks_obtained === undefined) {
                return NextResponse.json({
                    error: 'Each mark must have student_id, question_id, and marks_obtained'
                }, { status: 400 });
            }
        }

        // Fetch question details to validate max marks
        const questionIds = [...new Set(marks.map(m => m.question_id))];
        const { data: questions, error: questionsError } = await supabase
            .from('cie_questions')
            .select('id, max_marks')
            .in('id', questionIds);

        if (questionsError) {
            return NextResponse.json({ error: questionsError.message }, { status: 500 });
        }

        const questionMap = new Map(questions?.map(q => [q.id, q.max_marks]) || []);

        // Validate marks don't exceed max marks
        for (const mark of marks) {
            const maxMarks = questionMap.get(mark.question_id);
            if (maxMarks === undefined) {
                return NextResponse.json({
                    error: `Invalid question_id: ${mark.question_id}`
                }, { status: 400 });
            }
            if (mark.marks_obtained > maxMarks) {
                return NextResponse.json({
                    error: `Marks obtained (${mark.marks_obtained}) exceeds max marks (${maxMarks})`
                }, { status: 400 });
            }
            if (mark.marks_obtained < 0) {
                return NextResponse.json({
                    error: 'Marks cannot be negative'
                }, { status: 400 });
            }
        }

        // Upsert marks (insert or update)
        const marksToUpsert = marks.map(m => ({
            cie_question_id: m.question_id,
            student_id: m.student_id,
            marks_obtained: m.marks_obtained
        }));

        const { error: upsertError } = await supabase
            .from('cie_student_marks')
            .upsert(marksToUpsert, {
                onConflict: 'cie_question_id,student_id',
                ignoreDuplicates: false
            });

        if (upsertError) {
            return NextResponse.json({ error: upsertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Marks saved successfully',
            marksEntered: marks.length
        });
    } catch (error: any) {
        console.error('Error saving CIE marks:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
