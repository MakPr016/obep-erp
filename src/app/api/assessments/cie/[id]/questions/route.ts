import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    const { data: questions, error } = await supabase
        .from('cie_questions')
        .select(`
      *,
      course_outcomes(co_number, description)
    `)
        .eq('cie_assessment_id', id)
        .order('part_number')
        .order('question_number')
        .order('sub_question_label');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: questions });
}
