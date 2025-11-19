// src/app/api/assessments/cie/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const assignmentId = searchParams.get('assignmentId');
  const courseId = searchParams.get('courseId');

  let query = supabase
    .from('cie_assessments')
    .select(`
      *,
      course_class_assignments!inner(
        course_id,
        courses(course_name, course_code),
        classes(semester, section)
      )
    `)
    .order('created_at', { ascending: false });

  if (assignmentId) {
    query = query.eq('course_class_assignment_id', assignmentId);
  }

  if (courseId) {
    query = query.eq('course_class_assignments.course_id', courseId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    console.log("Received CIE Assessment Payload:", JSON.stringify(body, null, 2));

    const {
      course_class_assignment_id,
      assessment_type,
      total_marks,
      question_parts
    } = body;

    if (!course_class_assignment_id || !assessment_type || !question_parts) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Start transaction - Create assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('cie_assessments')
      .insert({
        course_class_assignment_id,
        assessment_type,
        total_marks
      })
      .select()
      .single();

    if (assessmentError) {
      console.error("Error creating assessment:", assessmentError);
      return NextResponse.json({ error: assessmentError.message }, { status: 500 });
    }

    if (!assessment) {
      console.error("Assessment creation returned no data");
      return NextResponse.json({ error: "Failed to create assessment record" }, { status: 500 });
    }

    // Create questions from parts
    const questions = [];
    for (const part of question_parts) {
      if (!part.subQuestions || !Array.isArray(part.subQuestions)) continue;

      // Question 1 of the pair
      for (const subQ of part.subQuestions) {
        questions.push({
          cie_assessment_id: assessment.id,
          question_number: part.question1Number,
          course_outcome_id: subQ.courseOutcomeId,
          max_marks: subQ.marks,
          blooms_level: subQ.bloomsLevel,
          sub_question_label: subQ.label,
          is_part_a: true,
          part_number: part.partNumber
        });
      }

      // Question 2 of the pair (mirrored structure)
      for (const subQ of part.subQuestions) {
        questions.push({
          cie_assessment_id: assessment.id,
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

    if (questions.length > 0) {
      const { error: questionsError } = await supabase
        .from('cie_questions')
        .insert(questions);

      if (questionsError) {
        console.error("Error inserting questions:", questionsError);
        // Rollback: delete assessment
        const supabaseRollback = await createClient();
        await supabaseRollback.from('cie_assessments').delete().eq('id', assessment.id);
        return NextResponse.json({ error: questionsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ data: assessment, message: 'Assessment created successfully' });
  } catch (error: any) {
    console.error("Unexpected error in CIE POST:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
