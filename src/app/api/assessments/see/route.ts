// src/app/api/assessments/see/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { 
    course_class_assignment_id, 
    total_marks,
    question_parts 
  } = body;

  // Create assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('see_assessments')
    .insert({
      course_class_assignment_id,
      total_marks
    })
    .select()
    .single();

  if (assessmentError) {
    return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  }

  // Create questions (same structure as CIE)
  const questions = [];
  for (const part of question_parts) {
    for (const subQ of part.subQuestions) {
      questions.push({
        see_assessment_id: assessment.id,
        question_number: part.question1Number,
        course_outcome_id: subQ.courseOutcomeId,
        max_marks: subQ.marks,
        blooms_level: subQ.bloomsLevel,
        sub_question_label: subQ.label,
        is_part_a: true,
        part_number: part.partNumber
      });
    }

    for (const subQ of part.subQuestions) {
      questions.push({
        see_assessment_id: assessment.id,
        question_number: part.question2Number,
        course_outcome_id: subQ.courseOutcomeId,
        max_marks: subQ.marks,
        blooms_level: subQ.bloomsLevel,
        sub_question_label: subQ.label,
        is_part_a: false,
        part_number: part.partNumber
      });
    }
  }

  const { error: questionsError } = await supabase
    .from('see_questions')
    .insert(questions);

  if (questionsError) {
    const supabaseRollback = await createClient();
    await supabaseRollback.from('see_assessments').delete().eq('id', assessment.id);
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json({ data: assessment, message: 'SEE Assessment created successfully' });
}
