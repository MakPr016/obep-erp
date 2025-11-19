// src/app/(main)/assessments/view/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function ViewAssessmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [cieAssessments, setCieAssessments] = useState([]);
  const [seeAssessments, setSeeAssessments] = useState([]);

  useEffect(() => {
    if (courseId) {
      fetchAssessments();
    }
  }, [courseId]);

  const fetchAssessments = async () => {
    try {
      const cieRes = await fetch(`/api/assessments/cie?courseId=${courseId}`);
      const cieData = await cieRes.json();
      setCieAssessments(cieData.data || []);

      const seeRes = await fetch(`/api/assessments/see?courseId=${courseId}`);
      const seeData = await seeRes.json();
      setSeeAssessments(seeData.data || []);
    } catch (error) {
      toast.error('Failed to load assessments');
    }
  };

  const handleDelete = async (assessmentId: string, type: 'cie' | 'see') => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const res = await fetch(`/api/assessments/${type}/${assessmentId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Assessment deleted successfully');
        fetchAssessments();
      } else {
        toast.error('Failed to delete assessment');
      }
    } catch {
      toast.error('Failed to delete assessment');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">View Assessments</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <Tabs defaultValue="cie">
        <TabsList>
          <TabsTrigger value="cie">CIE Assessments ({cieAssessments.length})</TabsTrigger>
          <TabsTrigger value="see">SEE Assessments ({seeAssessments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cie">
          {cieAssessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No CIE assessments found for this course.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {cieAssessments.map((assessment: any) => (
                <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="mb-2">{assessment.assessment_type}</Badge>
                        <CardTitle className="text-lg">
                          {assessment.course_class_assignments?.courses?.course_name || 'N/A'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {assessment.course_class_assignments?.users?.full_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <strong>Total Marks:</strong> {assessment.total_marks}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(assessment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/assessments/details/cie/${assessment.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/assessments/edit/cie/${assessment.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(assessment.id, 'cie')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="see">
          {seeAssessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No SEE assessments found for this course.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {seeAssessments.map((assessment: any) => (
                <Card key={assessment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="mb-2">SEE</Badge>
                        <CardTitle className="text-lg">
                          {assessment.course_class_assignments?.courses?.course_name || 'N/A'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {assessment.course_class_assignments?.users?.full_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <strong>Total Marks:</strong> {assessment.total_marks}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(assessment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/assessments/details/see/${assessment.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/assessments/edit/see/${assessment.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(assessment.id, 'see')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
