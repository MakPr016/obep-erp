import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    groupQuestionsByCO,
    calculatePOAttainment,
    calculateCoAttainmentStudentWise,
    type COAttainment
} from '@/lib/services/attainment-calculator';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: assessment, error: assessmentError } = await supabase
            .from('cie_assessments')
            .select(`
        *,
        course_class_assignments(
          id,
          academic_year,
          courses(id, course_name, course_code, set_target_percentage),
          classes(id, semester, section, branches(name))
        )
      `)
            .eq('id', id)
            .single();

        if (assessmentError || !assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        const targetThreshold = assessment.course_class_assignments?.courses?.set_target_percentage || 0.6;

        const { data: questions, error: questionsError } = await supabase
            .from('cie_questions')
            .select(`
        id,
        question_number,
        max_marks,
        part_number,
        course_outcome_id,
        course_outcomes(id, co_number, description)
      `)
            .eq('cie_assessment_id', id);

        if (questionsError) {
            return NextResponse.json({ error: questionsError.message }, { status: 500 });
        }

        if (!questions || questions.length === 0) {
            return NextResponse.json({ error: 'No questions found' }, { status: 404 });
        }

        const questionIds = questions.map(q => q.id);
        const { data: marks, error: marksError } = await supabase
            .from('cie_student_marks')
            .select('cie_question_id, student_id, marks_obtained, students(usn, name)')
            .in('cie_question_id', questionIds);

        if (marksError) {
            return NextResponse.json({ error: marksError.message }, { status: 500 });
        }

        const marksArr: any[] = marks || [];

        const coQuestionMap = groupQuestionsByCO(
            questions.map(q => ({
                id: q.id,
                course_outcome_id: q.course_outcome_id
            }))
        );

        const coAttainments: COAttainment[] = [];
        const coResultsForPO: any[] = [];

        for (const [coId, questionIdsForCO] of coQuestionMap.entries()) {
            const questionsForCO = questions.filter(q => questionIdsForCO.includes(q.id));

            const studentIds = [...new Set(marksArr
                .filter((m: any) => questionIdsForCO.includes(m.cie_question_id))
                .map((m: any) => m.student_id))];

            const studentData = studentIds.map(studentId => {
                const studentMarks = marksArr.filter((m: any) => m.student_id === studentId) || [];

                let totalObtained = 0;
                let totalMax = 0;

                const partsInCO = [...new Set(questionsForCO.map(q => q.part_number))];

                partsInCO.forEach(partNum => {
                    const questionsInPart = questionsForCO.filter(q => q.part_number === partNum);
                    const attemptsInPart = studentMarks.filter((m: any) =>
                        questionsInPart.some(q => q.id === m.cie_question_id)
                    );
                    if (attemptsInPart.length > 0) {
                        totalMax += questionsInPart[0].max_marks;
                        totalObtained += attemptsInPart.reduce((sum: number, m: any) => sum + (m.marks_obtained || 0), 0);
                    }
                });

                return {
                    student_id: studentId,
                    total_marks_obtained: totalObtained,
                    total_max_marks: totalMax
                };
            });

            const result = calculateCoAttainmentStudentWise(studentData, targetThreshold);

            const firstQuestion = questionsForCO[0];
            const coDetails = Array.isArray(firstQuestion?.course_outcomes)
                ? firstQuestion.course_outcomes[0]
                : firstQuestion?.course_outcomes;

            const coData = {
                course_outcome_id: coId,
                co_number: coDetails?.co_number || 'Unknown',
                description: coDetails?.description,
                students_attempted: result.students_attempted,
                students_attained: result.students_attained,
                attainment_percentage: result.percentage,
                attainment_level: result.level
            };

            coAttainments.push(coData);
            coResultsForPO.push({
                co_id: coId,
                co_number: coData.co_number,
                attainment_level: coData.attainment_level
            });
        }

        const { data: mappings } = await supabase
            .from('co_po_mappings')
            .select(`
                course_outcome_id,
                mapping_strength,
                program_outcomes(id, po_number, description)
            `)
            .in('course_outcome_id', Array.from(coQuestionMap.keys()));

        type PoMapping = {
            co_id: string;
            po_id: string;
            po_number: string;
            po_description: string;
            strength: number;
        };

        const flatMappings: PoMapping[] = (mappings ?? []).reduce((acc: PoMapping[], m: any) => {
            const po = Array.isArray(m.program_outcomes) ? m.program_outcomes[0] : m.program_outcomes;
            if (!po) return acc;
            acc.push({
                co_id: m.course_outcome_id,
                po_id: po.id,
                po_number: po.po_number,
                po_description: po.description,
                strength: Number(m.mapping_strength ?? 0)
            });
            return acc;
        }, [] as PoMapping[]);

        const poAttainments = calculatePOAttainment(coResultsForPO, flatMappings);

        const studentPerformance: any[] = [];
        const allStudentIds = [...new Set(marksArr.map((m: any) => m.student_id))];

        for (const studentId of allStudentIds) {
            const studentMarksRaw = marksArr.filter((m: any) => m.student_id === studentId) || [];
            const studentInfo: any = studentMarksRaw[0]?.students;
            const studentName = Array.isArray(studentInfo) ? studentInfo[0]?.name : studentInfo?.name;
            const studentUsn = Array.isArray(studentInfo) ? studentInfo[0]?.usn : studentInfo?.usn;

            const attainedCOs = coAttainments.map(co => {
                const coQuestionIds = coQuestionMap.get(co.course_outcome_id) || [];
                const questionsForCO = questions.filter(q => coQuestionIds.includes(q.id));

                let totalObtained = 0;
                let totalMax = 0;

                const partsInCO = [...new Set(questionsForCO.map(q => q.part_number))];
                partsInCO.forEach(partNum => {
                    const questionsInPart = questionsForCO.filter(q => q.part_number === partNum);
                    const attemptsInPart = studentMarksRaw.filter((m: any) =>
                        questionsInPart.some(q => q.id === m.cie_question_id)
                    );
                    if (attemptsInPart.length > 0) {
                        totalMax += questionsInPart[0].max_marks;
                        totalObtained += attemptsInPart.reduce((sum: number, m: any) => sum + (m.marks_obtained || 0), 0);
                    }
                });

                const percentage = totalMax > 0 ? (totalObtained / totalMax) : 0;
                return {
                    co_number: co.co_number,
                    percentage: percentage * 100,
                    attained: percentage >= targetThreshold
                };
            });

            studentPerformance.push({
                id: studentId,
                name: studentName,
                usn: studentUsn,
                cos: attainedCOs
            });
        }

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
            await supabase
                .from('co_attainment_results')
                .delete()
                .eq('course_class_assignment_id', courseClassAssignmentId)
                .eq('assessment_type', assessment.assessment_type);
            await supabase
                .from('co_attainment_results')
                .insert(attainmentRecords);
        }

        return NextResponse.json({
            meta: {
                assessment_type: assessment.assessment_type,
                course_name: assessment.course_class_assignments?.courses?.course_name,
                target_percentage: targetThreshold * 100
            },
            co_attainments: coAttainments.sort((a, b) => a.co_number.localeCompare(b.co_number)),
            po_attainments: poAttainments,
            student_performance: student_performance_sort(studentPerformance)
        });
    } catch (error: any) {
        console.error('Error calculating CIE attainment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function student_performance_sort(arr: any[]) {
    return arr.sort((a, b) => (a.usn || '').localeCompare(b.usn || ''));
}