import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: assessment, error: assessmentError } = await supabase
    .from('cie_assessments')
    .select(`
      *,
      course_class_assignments(
        id,
        courses(id, course_name, course_code),
        classes(id, semester, section, academic_year, branches(name)),
        users(full_name)
      )
    `)
    .eq('id', id)
    .single();

  if (assessmentError) {
    return NextResponse.json({ error: assessmentError.message }, { status: 500 });
  }

  const { data: questions, error: questionsError } = await supabase
    .from('cie_questions')
    .select(`
      *,
      course_outcomes(co_number, description)
    `)
    .eq('cie_assessment_id', id)
    .order('part_number')
    .order('question_number')
    .order('sub_question_label');

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { assessment, questions } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    
    const {
      assessment_type,
      total_marks,
      question_parts
    } = body;

    const { error: updateError } = await supabase
      .from('cie_assessments')
      .update({
        assessment_type,
        total_marks,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: existingQs } = await supabase
      .from('cie_questions')
      .select('id, part_number, sub_question_label, is_part_a')
      .eq('cie_assessment_id', id);

    const processedIds = new Set<string>();

    for (const part of question_parts) {
      if (!part.subQuestions) continue;

      const processSubQuestion = async (subQ: any, isPartA: boolean, qNum: number) => {
        const match = existingQs?.find(ex => 
          ex.part_number === part.partNumber && 
          ex.sub_question_label === subQ.label && 
          ex.is_part_a === isPartA
        );

        const payload = {
            cie_assessment_id: id,
            question_number: qNum,
            course_outcome_id: subQ.courseOutcomeId,
            max_marks: subQ.marks,
            blooms_level: subQ.bloomsLevel,
            sub_question_label: subQ.label,
            is_part_a: isPartA,
            part_number: part.partNumber,
            updated_at: new Date().toISOString()
        };

        if (match) {
            await supabase
                .from('cie_questions')
                .update(payload)
                .eq('id', match.id);
            processedIds.add(match.id);
        } else {
            const { data: newQ } = await supabase
                .from('cie_questions')
                .insert(payload)
                .select('id')
                .single();
            if (newQ) processedIds.add(newQ.id);
        }
      };

      for (const subQ of part.subQuestions) {
        await processSubQuestion(subQ, true, part.question1Number);
        await processSubQuestion(subQ, false, part.question2Number);
      }
    }

    const idsToDelete = existingQs
        ?.filter(q => !processedIds.has(q.id))
        .map(q => q.id) || [];

    if (idsToDelete.length > 0) {
        await supabase
            .from('cie_questions')
            .delete()
            .in('id', idsToDelete);
    }

    return NextResponse.json({ message: 'Assessment updated successfully' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { error } = await supabase
    .from('cie_assessments')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Assessment deleted successfully' });
}