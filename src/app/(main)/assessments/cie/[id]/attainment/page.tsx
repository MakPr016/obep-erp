'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import COAttainmentTable from '@/components/assessments/co-attainment-table';

interface COAttainment {
    course_outcome_id: string;
    co_number: string;
    description?: string;
    students_attempted: number;
    students_attained: number;
    attainment_percentage: number;
    attainment_level: 0 | 1 | 2 | 3;
}

interface AttainmentData {
    assessment_id: string;
    assessment_type: string;
    course_name?: string;
    co_attainments: COAttainment[];
}

export default function CIEAttainmentPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.id as string;

    const [attainmentData, setAttainmentData] = useState<AttainmentData | null>(null);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchAttainment();
    }, [assessmentId]);

    const fetchAttainment = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/assessments/cie/${assessmentId}/attainment`);
            const data = await res.json();

            if (res.ok) {
                setAttainmentData(data);
            } else {
                toast.error(data.error || 'Failed to load attainment data');
            }
        } catch (error) {
            console.error('Error fetching attainment:', error);
            toast.error('Failed to load attainment data');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        setCalculating(true);
        try {
            const res = await fetch(`/api/assessments/cie/${assessmentId}/attainment`);
            const data = await res.json();

            if (res.ok) {
                setAttainmentData(data);
                toast.success('Attainment recalculated successfully');
            } else {
                toast.error(data.error || 'Failed to recalculate attainment');
            }
        } catch (error) {
            console.error('Error recalculating attainment:', error);
            toast.error('Failed to recalculate attainment');
        } finally {
            setCalculating(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">CO Attainment</h1>
                        {attainmentData && (
                            <p className="text-muted-foreground mt-1">
                                {attainmentData.course_name} - {attainmentData.assessment_type}
                            </p>
                        )}
                    </div>
                </div>
                <Button
                    onClick={handleRecalculate}
                    disabled={calculating}
                >
                    {calculating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Calculating...
                        </>
                    ) : (
                        <>
                            <Calculator className="h-4 w-4 mr-2" />
                            Recalculate
                        </>
                    )}
                </Button>
            </div>

            {attainmentData && attainmentData.co_attainments.length > 0 ? (
                <COAttainmentTable
                    attainments={attainmentData.co_attainments}
                    assessmentType={attainmentData.assessment_type}
                />
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No attainment data available.</p>
                    <p className="text-sm mt-2">Please enter student marks first.</p>
                    <Button
                        className="mt-4"
                        onClick={() => router.push(`/assessments/cie/${assessmentId}/marks`)}
                    >
                        Enter Marks
                    </Button>
                </div>
            )}
        </div>
    );
}
