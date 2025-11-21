import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Fetch questions for this assessment to build headers
        const { data: questions, error } = await supabase
            .from('cie_questions')
            .select('question_number, sub_question_label')
            .eq('cie_assessment_id', id)
            .order('part_number')
            .order('question_number')
            .order('sub_question_label');

        if (error) {
            return new NextResponse('Error fetching questions', { status: 500 });
        }

        // Build CSV Headers: USN, 1a, 1b, 2, etc.
        const headers = ['USN'];
        
        if (questions) {
            questions.forEach(q => {
                const label = q.sub_question_label 
                    ? `${q.question_number}${q.sub_question_label}`
                    : `${q.question_number}`;
                headers.push(label);
            });
        }

        const csvContent = headers.join(',');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="marks_template.csv"`,
            },
        });
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}