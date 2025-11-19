'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Save, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
    id: string;
    question_number: number;
    sub_question_label: string;
    part_number: number;
    max_marks: number;
}

interface StudentMark {
    question_id: string;
    question_number: number;
    sub_question_label: string;
    part_number: number;
    max_marks: number;
    marks_obtained: number | null;
}

interface Student {
    id: string;
    usn: string;
    name: string;
    marks: StudentMark[];
    total: number;
}

interface Assessment {
    id: string;
    assessment_type: string;
    total_marks: number;
}

interface ClassInfo {
    semester: number;
    section: string;
    branch_name: string;
}

export default function CIEMarksEntryPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.id as string;
    const assignmentId = params.assignmentId as string;

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changedMarks, setChangedMarks] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchMarksData();
    }, [assessmentId, assignmentId]);

    const fetchMarksData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/assessments/cie/${assessmentId}/marks?assignmentId=${assignmentId}`);
            const data = await res.json();

            if (res.ok) {
                setAssessment(data.assessment);
                setClassInfo(data.classInfo);
                setStudents(data.students || []);
                setQuestions(data.questions || []);
            } else {
                toast.error(data.error || 'Failed to load marks data');
            }
        } catch (error) {
            console.error('Error fetching marks:', error);
            toast.error('Failed to load marks data');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId: string, questionId: string, value: string) => {
        const numValue = value === '' ? null : parseFloat(value);

        setStudents(prevStudents =>
            prevStudents.map(student => {
                if (student.id !== studentId) return student;

                const updatedMarks = student.marks.map(mark => {
                    if (mark.question_id !== questionId) return mark;

                    // Validate max marks
                    if (numValue !== null && numValue > mark.max_marks) {
                        toast.error(`Marks cannot exceed ${mark.max_marks}`);
                        return mark;
                    }

                    if (numValue !== null && numValue < 0) {
                        toast.error('Marks cannot be negative');
                        return mark;
                    }

                    return { ...mark, marks_obtained: numValue };
                });

                const total = updatedMarks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);

                return { ...student, marks: updatedMarks, total };
            })
        );

        // Track changed marks
        setChangedMarks(prev => new Set(prev).add(`${studentId}-${questionId}`));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // Prepare marks data
            const marksData = students.flatMap(student =>
                student.marks
                    .filter(mark => mark.marks_obtained !== null)
                    .map(mark => ({
                        student_id: student.id,
                        question_id: mark.question_id,
                        marks_obtained: mark.marks_obtained
                    }))
            );

            const res = await fetch(`/api/assessments/cie/${assessmentId}/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marks: marksData })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Marks saved successfully');
                setChangedMarks(new Set());
            } else {
                toast.error(data.error || 'Failed to save marks');
            }
        } catch (error) {
            console.error('Error saving marks:', error);
            toast.error('Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    const handleCalculateAttainment = async () => {
        // First save marks
        await handleSaveAll();

        // Navigate to attainment page with assignment ID
        router.push(`/assessments/cie/${assessmentId}/attainment?assignmentId=${assignmentId}`);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Group questions by part for display
    const questionsByPart = questions.reduce((acc, q) => {
        if (!acc[q.part_number]) acc[q.part_number] = [];
        acc[q.part_number].push(q);
        return acc;
    }, {} as Record<number, Question[]>);

    return (
        <div className="container mx-auto p-6 max-w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Enter Marks</h1>
                        {assessment && classInfo && (
                            <p className="text-muted-foreground mt-1">
                                {assessment.assessment_type} - {classInfo.branch_name} Sem {classInfo.semester} ({classInfo.section})
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleSaveAll}
                        disabled={saving || changedMarks.size === 0}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save All {changedMarks.size > 0 && `(${changedMarks.size})`}
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleCalculateAttainment}
                        variant="secondary"
                    >
                        <Calculator className="h-4 w-4 mr-2" />
                        Save & Calculate Attainment
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student Marks Entry</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Total Students: {students.length} | Total Questions: {questions.length} | Total Marks: {assessment?.total_marks}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background z-10 min-w-[100px]">USN</TableHead>
                                    <TableHead className="sticky left-[100px] bg-background z-10 min-w-[200px]">Name</TableHead>
                                    {Object.entries(questionsByPart).map(([partNum, partQuestions]) =>
                                        partQuestions.map(q => (
                                            <TableHead key={q.id} className="text-center min-w-[80px]">
                                                <div className="text-xs">
                                                    <div>Q{q.question_number}</div>
                                                    <div>({q.sub_question_label})</div>
                                                    <div className="text-muted-foreground">{q.max_marks}m</div>
                                                </div>
                                            </TableHead>
                                        ))
                                    )}
                                    <TableHead className="text-center font-semibold">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={questions.length + 3} className="text-center py-8 text-muted-foreground">
                                            No students found in this class
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell className="sticky left-0 bg-background font-medium">{student.usn}</TableCell>
                                            <TableCell className="sticky left-[100px] bg-background">{student.name}</TableCell>
                                            {student.marks.map(mark => (
                                                <TableCell key={mark.question_id} className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        max={mark.max_marks}
                                                        value={mark.marks_obtained ?? ''}
                                                        onChange={(e) => handleMarkChange(student.id, mark.question_id, e.target.value)}
                                                        className="w-full text-center"
                                                        placeholder="0"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center font-semibold">
                                                {student.total.toFixed(1)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
