import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: assessmentId } = await params;
        const { marksData } = await request.json();
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('assignmentId');
        const supabase = await createClient();

        if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        // 1. Fetch Context
        const { data: assessment } = await supabase
            .from('cie_assessments')
            .select('course_class_assignment_id')
            .eq('id', assessmentId)
            .single();

        if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

        let classId;

        if (assignmentId) {
            const { data: assignment } = await supabase
                .from('course_class_assignments')
                .select('class_id')
                .eq('id', assignmentId)
                .single();
            classId = assignment?.class_id;
        } else {
            const { data: assignment } = await supabase
                .from('course_class_assignments')
                .select('class_id')
                .eq('id', assessment.course_class_assignment_id)
                .single();
            classId = assignment?.class_id;
        }

        const { data: questions } = await supabase
            .from('cie_questions')
            .select('id, question_number, sub_question_label, max_marks')
            .eq('cie_assessment_id', assessmentId);

        if (!questions || questions.length === 0) {
            return NextResponse.json({ error: "Assessment has no questions defined" }, { status: 400 });
        }

        const { data: students } = await supabase
            .from('students')
            .select('id, usn')
            .eq('class_id', classId)
            .eq('is_active', true);

        if (!students) return NextResponse.json({ error: "No students found in this class" }, { status: 400 });

        // 2. Build Maps
        const studentMap = new Map(students.map(s => [s.usn.trim().toLowerCase(), s.id]));

        const questionLabelMap = new Map();
        questions.forEach(q => {
            // Robust Label Generation: 1a, 1b, etc.
            const qNum = q.question_number;
            const sub = q.sub_question_label ? q.sub_question_label.trim() : '';
            const label = `${qNum}${sub}`.toLowerCase();
            questionLabelMap.set(label, q);
        });

        // 3. Helper: Clean Header Keys
        const cleanKey = (key: string) => {
            return key.toString().trim().toLowerCase()
                .replace(/^\ufeff/, '') // Remove BOM
                .replace(/['"]+/g, '')  // Remove quotes
                .replace(/^q(?=\d)/, '') // Remove 'q' prefix if followed by digit (q1a -> 1a)
                .replace(/\s+/g, '');   // Remove all spaces
        };

        // 4. Process Rows
        const marksToUpsert = [];
        const errors = [];
        const matchedHeaders = new Set();

        for (const row of marksData) {
            // Find USN
            const usnKey = Object.keys(row).find(k => cleanKey(k) === 'usn');
            if (!usnKey || !row[usnKey]) continue;

            const usn = row[usnKey].toString().trim().toLowerCase();
            const studentId = studentMap.get(usn);

            if (!studentId) {
                errors.push(`Student not found: ${row[usnKey]}`);
                continue;
            }

            for (const [header, value] of Object.entries(row)) {
                const cleanedHeader = cleanKey(header);
                if (cleanedHeader === 'usn') continue;

                const question = questionLabelMap.get(cleanedHeader);

                if (question) {
                    matchedHeaders.add(cleanedHeader);
                    let marks = parseFloat(value as string);

                    if (isNaN(marks)) continue;

                    if (marks < 0) marks = 0;
                    if (marks > question.max_marks) {
                        errors.push(`USN ${usn.toUpperCase()}: Q${cleanedHeader} marks (${marks}) exceed max (${question.max_marks})`);
                        continue;
                    }

                    marksToUpsert.push({
                        cie_question_id: question.id,
                        student_id: studentId,
                        marks_obtained: marks,
                        updated_at: new Date().toISOString()
                    });
                }
            }
        }

        // 5. Strict Validation & Debugging
        if (marksToUpsert.length === 0) {
            const csvHeaders = marksData.length > 0 ? Object.keys(marksData[0]).map(cleanKey).filter(h => h !== 'usn') : [];
            const expectedHeaders = Array.from(questionLabelMap.keys());

            return NextResponse.json({
                error: "No valid marks found. Please check CSV headers.",
                debug: {
                    received: csvHeaders,
                    expected: expectedHeaders,
                    match_attempted: `Tried matching '${csvHeaders[0]}' against '${expectedHeaders.join(', ')}'`
                },
                details: errors
            }, { status: 400 });
        }

        const { error } = await supabase
            .from('cie_student_marks')
            .upsert(marksToUpsert, { onConflict: 'cie_question_id,student_id' });

        if (error) throw error;

        const uniqueStudentIds = new Set(marksToUpsert.map(m => m.student_id));

        return NextResponse.json({
            success: true,
            count: marksToUpsert.length,
            studentsCount: uniqueStudentIds.size,
            warnings: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json({ error: error.message || "Import failed" }, { status: 500 });
    }
}