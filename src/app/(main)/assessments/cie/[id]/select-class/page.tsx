'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ClassOption {
    id: string;
    class_id: string;
    semester: number;
    section: string;
    academic_year: string;
    branch_name: string;
    faculty_name: string;
    student_count: number;
}

export default function SelectClassPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.id as string;

    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [assessmentInfo, setAssessmentInfo] = useState<any>(null);

    useEffect(() => {
        fetchClassesForAssessment();
    }, [assessmentId]);

    const fetchClassesForAssessment = async () => {
        setLoading(true);
        try {
            // First get assessment details to find the course
            const assessmentRes = await fetch(`/api/assessments/cie/${assessmentId}`);
            const assessmentData = await assessmentRes.json();

            if (!assessmentData.data) {
                toast.error('Assessment not found');
                return;
            }

            setAssessmentInfo(assessmentData.data.assessment);
            const courseId = assessmentData.data.assessment.course_class_assignments?.courses?.id;

            if (!courseId) {
                toast.error('Course not found for this assessment');
                return;
            }

            // Fetch all course-class assignments for this course
            const classesRes = await fetch(`/api/courses/${courseId}/classes`);
            const classesData = await classesRes.json();

            setClasses(classesData.classes || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClass = (assignmentId: string) => {
        router.push(`/assessments/cie/${assessmentId}/marks/${assignmentId}`);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <div className="mb-6">
                <h1 className="text-3xl font-bold">Select Class</h1>
                {assessmentInfo && (
                    <p className="text-muted-foreground mt-2">
                        {assessmentInfo.course_class_assignments?.courses?.course_name} - {assessmentInfo.assessment_type}
                    </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                    Choose a class to enter marks for this assessment
                </p>
            </div>

            {classes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No classes found for this course
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {classes.map((classOption) => (
                        <Card
                            key={classOption.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleSelectClass(classOption.id)}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div>
                                        <span className="text-lg">
                                            {classOption.branch_name} - Semester {classOption.semester} ({classOption.section})
                                        </span>
                                    </div>
                                    <Button size="sm">
                                        Select
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Academic Year</p>
                                        <p className="font-medium">{classOption.academic_year}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Faculty</p>
                                        <p className="font-medium">{classOption.faculty_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Students</p>
                                        <p className="font-medium flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {classOption.student_count}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
