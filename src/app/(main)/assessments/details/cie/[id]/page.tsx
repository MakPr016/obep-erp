'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Question {
    id: string;
    question_number: number;
    sub_question_label: string;
    max_marks: number;
    blooms_level: string;
    is_part_a: boolean;
    part_number: number;
    course_outcomes?: {
        co_number: string;
        description: string;
    };
}

interface AssessmentDetails {
    id: string;
    assessment_type: string;
    total_marks: number;
    created_at: string;
    course_class_assignments?: {
        courses?: {
            course_name: string;
            course_code: string;
        };
        classes?: {
            semester: number;
            section: string;
            academic_year: string;
            branches?: {
                name: string;
            };
        };
        users?: {
            full_name: string;
        };
    };
}

export default function CIEAssessmentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.id as string;

    const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (assessmentId) {
            fetchAssessmentDetails();
        }
    }, [assessmentId]);

    const fetchAssessmentDetails = async () => {
        setLoading(true);
        try {
            const assessmentRes = await fetch(`/api/assessments/cie/${assessmentId}`);
            const assessmentData = await assessmentRes.json();

            if (assessmentData.data) {
                setAssessment(assessmentData.data.assessment);
                setQuestions(assessmentData.data.questions || []);
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
            toast.error('Failed to load assessment details');
        } finally {
            setLoading(false);
        }
    };

    const groupQuestionsByPart = () => {
        const parts: { [key: number]: Question[] } = {};

        questions.forEach(q => {
            if (!parts[q.part_number]) {
                parts[q.part_number] = [];
            }
            parts[q.part_number].push(q);
        });

        return parts;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Assessment not found</p>
                    <Button className="mt-4" onClick={() => router.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const partGroups = groupQuestionsByPart();

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="text-base">{assessment.assessment_type}</Badge>
                                <span className="text-sm text-muted-foreground">
                                    Total: {assessment.total_marks} marks
                                </span>
                            </div>
                            <CardTitle className="text-2xl">
                                {assessment.course_class_assignments?.courses?.course_name || 'N/A'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {assessment.course_class_assignments?.courses?.course_code || 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Branch</p>
                            <p className="text-base">{assessment.course_class_assignments?.classes?.branches?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Semester</p>
                            <p className="text-base">{assessment.course_class_assignments?.classes?.semester || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                            <p className="text-base">{assessment.course_class_assignments?.classes?.academic_year || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Faculty</p>
                            <p className="text-base">{assessment.course_class_assignments?.users?.full_name || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Created on {new Date(assessment.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Question Paper Structure</h2>

            {Object.keys(partGroups).length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No questions found for this assessment
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(partGroups).map(([partNum, partQuestions]) => {
                        const q1Questions = partQuestions.filter((q: Question) => q.is_part_a);
                        const q2Questions = partQuestions.filter((q: Question) => !q.is_part_a);
                        const q1Number = q1Questions[0]?.question_number;
                        const q2Number = q2Questions[0]?.question_number;

                        return (
                            <Card key={partNum}>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Part {partNum}
                                        <span className="ml-4 text-sm font-normal text-muted-foreground">
                                            Question {q1Number} OR Question {q2Number}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                <Badge variant="outline">Q{q1Number}</Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    ({q1Questions.reduce((sum: number, q: Question) => sum + q.max_marks, 0)} marks)
                                                </span>
                                            </h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-16">Sub-Q</TableHead>
                                                        <TableHead>CO</TableHead>
                                                        <TableHead>BL</TableHead>
                                                        <TableHead className="text-right">Marks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {q1Questions.map((q: Question) => (
                                                        <TableRow key={q.id}>
                                                            <TableCell className="font-medium">({q.sub_question_label})</TableCell>
                                                            <TableCell>{q.course_outcomes?.co_number || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {q.blooms_level}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">{q.max_marks}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                <Badge variant="outline">Q{q2Number}</Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    ({q2Questions.reduce((sum: number, q: Question) => sum + q.max_marks, 0)} marks)
                                                </span>
                                            </h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-16">Sub-Q</TableHead>
                                                        <TableHead>CO</TableHead>
                                                        <TableHead>BL</TableHead>
                                                        <TableHead className="text-right">Marks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {q2Questions.map((q: Question) => (
                                                        <TableRow key={q.id}>
                                                            <TableCell className="font-medium">({q.sub_question_label})</TableCell>
                                                            <TableCell>{q.course_outcomes?.co_number || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {q.blooms_level}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">{q.max_marks}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
