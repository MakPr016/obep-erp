'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Calculator, BookOpen, GraduationCap, Users } from 'lucide-react';
import { toast } from 'sonner';
import COAttainmentTable from '@/components/assessments/co-attainment-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface AttainmentResponse {
    meta: {
        assessment_type: string;
        course_name: string;
        course_code: string;
        class_name: string;
        branch: string;
        academic_year: string;
        target_percentage: number;
    };
    co_attainments: any[];
    po_attainments: any[];
    student_performance: any[];
}

export default function CIEAttainmentPage() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.id as string;

    const [data, setData] = useState<AttainmentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchAttainment();
    }, [assessmentId]);

    const fetchAttainment = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/assessments/cie/${assessmentId}/attainment`);
            const json = await res.json();

            if (res.ok) {
                setData(json);
            } else {
                toast.error(json.error || 'Failed to load attainment data');
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
            const json = await res.json();
            if (res.ok) {
                setData(json);
                toast.success('Attainment recalculated successfully');
            } else {
                toast.error(json.error || 'Failed to recalculate attainment');
            }
        } catch (error) {
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

    if (!data) return <div>No data found</div>;

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Assessment Attainment</h1>
                        <div className="text-sm text-muted-foreground mt-1 flex gap-3">
                            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {data.meta.course_name}</span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {data.meta.branch} - {data.meta.class_name}</span>
                            <span className="text-gray-300">|</span>
                            <span>{data.meta.academic_year}</span>
                        </div>
                    </div>
                </div>
                <Button onClick={handleRecalculate} disabled={calculating}>
                    {calculating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                    Recalculate
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Assessment Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.meta.assessment_type}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Target Threshold</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.meta.target_percentage}%</div>
                        <p className="text-xs text-muted-foreground">Marks required to attain CO</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="co" className="w-full">
                <TabsList>
                    <TabsTrigger value="co">CO Analysis</TabsTrigger>
                    <TabsTrigger value="po">PO Analysis</TabsTrigger>
                    <TabsTrigger value="student">Student View</TabsTrigger>
                </TabsList>

                <TabsContent value="co" className="space-y-4">
                   <COAttainmentTable attainments={data.co_attainments} assessmentType={data.meta.assessment_type} />
                </TabsContent>

                <TabsContent value="po">
                    <Card>
                        <CardHeader>
                            <CardTitle>PO Attainment (Projected)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-center">Attainment Level</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.po_attainments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No PO mappings found for these COs</TableCell>
                                        </TableRow>
                                    ) : (
                                        data.po_attainments.map((po) => (
                                            <TableRow key={po.program_outcome_id}>
                                                <TableCell className="font-medium">{po.po_number}</TableCell>
                                                <TableCell className="max-w-md truncate" title={po.description}>{po.description}</TableCell>
                                                <TableCell className="text-center font-bold">{po.calculated_attainment}</TableCell>
                                                <TableCell className="text-center">
                                                    {po.calculated_attainment >= 2 ? 
                                                        <Badge className="bg-green-600">Good</Badge> : 
                                                        po.calculated_attainment >= 1 ? <Badge className="bg-yellow-500">Average</Badge> : <Badge variant="destructive">Low</Badge>
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="student">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>USN</TableHead>
                                            <TableHead>Name</TableHead>
                                            {data.co_attainments.map(co => (
                                                <TableHead key={co.course_outcome_id} className="text-center">{co.co_number}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.student_performance.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.usn}</TableCell>
                                                <TableCell>{student.name}</TableCell>
                                                {student.cos.map((co: any, idx: number) => (
                                                    <TableCell key={idx} className="text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs text-muted-foreground">{co.percentage.toFixed(0)}%</span>
                                                            {co.attained ? 
                                                                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Y</Badge> : 
                                                                <Badge variant="outline" className="border-red-200 text-red-400 bg-red-50">N</Badge>
                                                            }
                                                        </div>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}