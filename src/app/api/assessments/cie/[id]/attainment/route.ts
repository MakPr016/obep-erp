// src/app/api/assessments/cie/[id]/attainment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    calculateQuestionAttainment,
    calculateCOAttainment,
    groupQuestionsByCO,
    type COAttainment
} from '@/lib/services/attainment-calculator';

/**
 * GET /api/assessments/cie/[id]/attainment
 * Calculate CO attainment for a CIE assessment
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Fetch assessment details
        const { data: assessment, error: assessmentError } = await supabase
            .from('cie_assessments')
            .select(`
        *,
        course_class_assignments(
          id,
          courses(course_name, course_code)
        )
      `)
            .eq('id', id)
            .single();

        if (assessmentError || !assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        // Fetch all questions with CO mappings
        const { data: questions, error: questionsError } = await supabase
            .from('cie_questions')
            .select(`
        id,
        question_number,
        max_marks,
        course_outcome_id,
        course_outcomes(id, co_number, description)
      `)
            .eq('cie_assessment_id', id);

        if (questionsError) {
            return NextResponse.json({ error: questionsError.message }, { status: 500 });
        }

        if (!questions || questions.length === 0) {
            return NextResponse.json({
                error: 'No questions found for this assessment'
            }, { status: 404 });
        }

        // Fetch all student marks for these questions
        const questionIds = questions.map(q => q.id);
        const { data: marks, error: marksError } = await supabase
            .from('cie_student_marks')
            .select('*')
            .in('cie_question_id', questionIds);

        if (marksError) {
            return NextResponse.json({ error: marksError.message }, { status: 500 });
        }

        // Group questions by CO
        const coQuestionMap = groupQuestionsByCO(
            questions.map(q => ({
                id: q.id,
                course_outcome_id: q.course_outcome_id
            }))
        );

        // Calculate attainment for each CO
        const coAttainments: COAttainment[] = [];

        for (const [coId, questionIdsForCO] of coQuestionMap.entries()) {
            const questionsForCO = questions.filter(q => questionIdsForCO.includes(q.id));

            // Calculate attainment for each question
            const questionAttainments = questionsForCO.map(question => {
                const questionMarks = marks?.filter(m => m.cie_question_id === question.id) || [];
                const studentMarks = questionMarks.map(m => ({
                    student_id: m.student_id,
                    marks_obtained: m.marks_obtained
                }));

                const attainment = calculateQuestionAttainment(
                    studentMarks,
                    question.max_marks,
                    0.6 // 60% threshold
                );

                return {
                    question_id: question.id,
                    ...attainment
                };
            });

            // Calculate overall CO attainment
            const coAttainment = calculateCOAttainment(questionAttainments);

            // Get CO details from first question (all questions for same CO have same details)
            const firstQuestion = questionsForCO[0];
            const coDetails = Array.isArray(firstQuestion?.course_outcomes)
                ? firstQuestion.course_outcomes[0]
                : firstQuestion?.course_outcomes;

            coAttainments.push({
                course_outcome_id: coId,
                co_number: coDetails?.co_number || 'Unknown',
                description: coDetails?.description,
                ...coAttainment
            });
        }

        // Store results in co_attainment_results table
        const courseClassAssignmentId = assessment.course_class_assignments?.id;

        if (courseClassAssignmentId) {
            const attainmentRecords = coAttainments.map(co => ({
                course_class_assignment_id: courseClassAssignmentId,
                course_outcome_id: co.course_outcome_id,
                assessment_type: assessment.assessment_type,
                students_attempted: co.students_attempted,
                students_attained: co.students_attained,
                attainment_percentage: co.attainment_percentage,
                attainment_level: co.attainment_level
            }));

            // Delete existing records for this assessment and COs
            await supabase
                .from('co_attainment_results')
                .delete()
                .eq('course_class_assignment_id', courseClassAssignmentId)
                .eq('assessment_type', assessment.assessment_type);

            // Insert new records
            const { error: insertError } = await supabase
                .from('co_attainment_results')
                .insert(attainmentRecords);

            if (insertError) {
                console.error('Error storing attainment results:', insertError);
                // Continue anyway - we'll still return the calculated results
            }
        }

        return NextResponse.json({
            assessment_id: id,
            assessment_type: assessment.assessment_type,
            course_name: assessment.course_class_assignments?.courses?.course_name,
            co_attainments: coAttainments.sort((a, b) =>
                a.co_number.localeCompare(b.co_number)
            )
        });
    } catch (error: any) {
        console.error('Error calculating CIE attainment:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
