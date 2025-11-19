// src/app/api/assessments/cie/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data: assessment, error: assessmentError } = await supabase
    .from('cie_assessments')
    .select(`
      *,
      course_class_assignments(
        courses(id, course_name, course_code),
        classes(id, semester, section),
        users(full_name)
      )
    `)
    .eq('id', params.id)
    .single();

  if (assessmentError) {
    return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  }

  // Get questions grouped by parts
  const { data: questions, error: questionsError } = await supabase
    .from('cie_questions')
    .select(`
      *,
      course_outcomes(co_number, description)
    `)
    .eq('cie_assessment_id', params.id)
    .order('part_number')
    .order('question_number')
    .order('sub_question_label');

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { assessment, questions } });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  // Questions will be cascade deleted due to foreign key
  const { error } = await supabase
    .from('cie_assessments')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Assessment deleted successfully' });
}
