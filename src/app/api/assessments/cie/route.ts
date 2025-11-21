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
    // Filter by the course_id on the joined table
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
    
    const {
      course_class_assignment_id,
      assessment_type,
      total_marks,
      question_parts
    } = body;

    if (!course_class_assignment_id || !assessment_type || !question_parts) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate questions before database interaction
    for (const part of question_parts) {
      if (part.subQuestions && Array.isArray(part.subQuestions)) {
        for (const subQ of part.subQuestions) {
          if (subQ.marks <= 0) {
             return NextResponse.json({ error: `Invalid marks for Question ${part.question1Number}. Marks must be > 0.` }, { status: 400 });
          }
          if (!subQ.courseOutcomeId || subQ.courseOutcomeId.trim() === "") {
             return NextResponse.json({ error: `Missing Course Outcome for Question ${part.question1Number}.` }, { status: 400 });
          }
        }
      }
    }

    // Check for duplicate
    const { data: existingAssessment } = await supabase
      .from('cie_assessments')
      .select('id')
      .eq('course_class_assignment_id', course_class_assignment_id)
      .eq('assessment_type', assessment_type)
      .single();

    if (existingAssessment) {
        return NextResponse.json({ 
            error: `A ${assessment_type} assessment already exists for this class. Please edit the existing assessment instead.` 
        }, { status: 409 });
    }

    // Create Assessment
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
      return NextResponse.json({ error: assessmentError.message }, { status: 500 });
    }

    // Prepare Questions
    const questions = [];
    for (const part of question_parts) {
      if (!part.subQuestions) continue;

      // Part A Question
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

      // Part B Question (Mirror)
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
        await supabase.from('cie_assessments').delete().eq('id', assessment.id);
        return NextResponse.json({ error: questionsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ data: assessment, message: 'Assessment created successfully' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}