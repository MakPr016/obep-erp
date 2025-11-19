// src/app/(main)/assessments/create/cie/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QuestionPartBuilder from '@/components/assessments/question-part-builder';

interface SubQuestion {
  label: string;
  marks: number;
  bloomsLevel: string;
  courseOutcomeId: string;
}

interface QuestionPart {
  partNumber: number;
  question1Number: number;
  question2Number: number;
  subQuestions: SubQuestion[];
}

export default function CreateCIEAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');

  const [assessmentType, setAssessmentType] = useState('');
  const [totalMarks, setTotalMarks] = useState(30);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [questionParts, setQuestionParts] = useState<QuestionPart[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchCourseOutcomes();
    }
  }, [assignmentId]);

  const fetchCourseOutcomes = async () => {
    try {
      // First get course ID from assignment
      const assignmentRes = await fetch(`/api/course-assignments/${assignmentId}`);
      const assignment = await assignmentRes.json();
      
      const response = await fetch(`/api/course-outcomes?courseId=${assignment.data.course_id}`);
      const result = await response.json();
      setCourseOutcomes(result.data || []);
    } catch (error) {
      toast.error('Failed to load course outcomes');
    }
  };

  const handleSubmit = async () => {
    if (!assessmentType) {
      toast.error('Please select assessment type');
      return;
    }

    if (questionParts.length === 0) {
      toast.error('Please add at least one question part');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/assessments/cie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_class_assignment_id: assignmentId,
          assessment_type: assessmentType,
          total_marks: totalMarks,
          question_parts: questionParts
        })
      });

      if (!response.ok) throw new Error('Failed to create assessment');

      toast.success('Assessment created successfully');
      router.push('/assessments');
    } catch (error) {
      toast.error('Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Create CIE Assessment</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Assessment Type</Label>
            <Select value={assessmentType} onValueChange={setAssessmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CIE1">CIE 1</SelectItem>
                <SelectItem value="CIE2">CIE 2</SelectItem>
                <SelectItem value="CIE3">CIE 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Total Marks</Label>
            <Input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <QuestionPartBuilder
        questionParts={questionParts}
        setQuestionParts={setQuestionParts}
        courseOutcomes={courseOutcomes}
      />

      <div className="flex gap-4 mt-6">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Assessment'}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
