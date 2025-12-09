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
import { BloomsCheckButton } from '@/components/tools/blooms-check-button';

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

interface Assignment {
  id: string;
  classes: {
    semester: number;
    section: string;
    academic_year: string;
  };
  users: {
    full_name: string;
  };
}

export default function CreateCIEAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [assessmentType, setAssessmentType] = useState('');
  const [totalMarks, setTotalMarks] = useState(40);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [questionParts, setQuestionParts] = useState<QuestionPart[]>([]);
  const [loading, setLoading] = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  useEffect(() => {
    if (courseId) {
      fetchCourseOutcomes();
      fetchAssignments();
    }
  }, [courseId]);

  const fetchCourseOutcomes = async () => {
    try {
      const response = await fetch(`/api/course-outcomes?courseId=${courseId}`);
      const result = await response.json();
      setCourseOutcomes(result.data || []);
    } catch {
      toast.error('Failed to load course outcomes');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/course-class-assignments?courseId=${courseId}`);
      const result = await response.json();
      setAssignments(result.data || []);

      if (result.data && result.data.length === 1) {
        setSelectedAssignmentId(result.data[0].id);
      }
    } catch {
      toast.error('Failed to load faculty assignments');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignmentId) {
      toast.error('Please select a faculty/class');
      return;
    }

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
          course_class_assignment_id: selectedAssignmentId,
          assessment_type: assessmentType,
          total_marks: totalMarks,
          question_parts: questionParts
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assessment');
      }

      toast.success('Assessment created successfully');
      router.push('/assessments');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create CIE Assessment</h1>
        <BloomsCheckButton />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Changed from space-y-4 to a grid layout for row-based alignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Assigned Faculty</Label>
              <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.users.full_name} (Sem {assignment.classes.semester} {assignment.classes.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assessment Type</Label>
              <Select value={assessmentType} onValueChange={setAssessmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIE-I">CIE-I</SelectItem>
                  <SelectItem value="CIE-II">CIE-II</SelectItem>
                  <SelectItem value="CIE-III">CIE-III</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
              />
            </div>
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
