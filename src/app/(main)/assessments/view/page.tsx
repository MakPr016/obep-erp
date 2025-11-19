// src/app/(main)/assessments/view/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ViewAssessmentsPage() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');
  const [cieAssessments, setCieAssessments] = useState([]);
  const [seeAssessments, setSeeAssessments] = useState([]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssessments();
    }
  }, [assignmentId]);

  const fetchAssessments = async () => {
    try {
      const cieRes = await fetch(`/api/assessments/cie?assignmentId=${assignmentId}`);
      const cieData = await cieRes.json();
      setCieAssessments(cieData.data || []);

      const seeRes = await fetch(`/api/assessments/see?assignmentId=${assignmentId}`);
      const seeData = await seeRes.json();
      setSeeAssessments(seeData.data || []);
    } catch (error) {
      toast.error('Failed to load assessments');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">View Assessments</h1>

      <Tabs defaultValue="cie">
        <TabsList>
          <TabsTrigger value="cie">CIE Assessments ({cieAssessments.length})</TabsTrigger>
          <TabsTrigger value="see">SEE Assessments ({seeAssessments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cie">
          <div className="grid gap-4">
            {cieAssessments.map((assessment: any) => (
              <Card key={assessment.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      <Badge>{assessment.assessment_type}</Badge>
                    </CardTitle>
                    <span className="text-sm">Total: {assessment.total_marks} marks</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(assessment.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="see">
          <div className="grid gap-4">
            {seeAssessments.map((assessment: any) => (
              <Card key={assessment.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>SEE Assessment</CardTitle>
                    <span className="text-sm">Total: {assessment.total_marks} marks</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(assessment.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
