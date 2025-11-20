'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
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

export default function EditCIEAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;

  const [assessmentType, setAssessmentType] = useState('');
  const [totalMarks, setTotalMarks] = useState(0);
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [questionParts, setQuestionParts] = useState<QuestionPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);

  useEffect(() => {
    fetchAssessmentData();
  }, [assessmentId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assessments/cie/${assessmentId}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to fetch data');

      const { assessment, questions } = json.data;
      setAssessmentData(assessment);
      setAssessmentType(assessment.assessment_type);
      setTotalMarks(assessment.total_marks);

      await fetchCourseOutcomes(assessment.course_class_assignments?.courses?.id);

      const partsMap = new Map<number, QuestionPart>();

      questions.forEach((q: any) => {
        if (!partsMap.has(q.part_number)) {
          partsMap.set(q.part_number, {
            partNumber: q.part_number,
            question1Number: q.is_part_a ? q.question_number : 0,
            question2Number: !q.is_part_a ? q.question_number : 0,
            subQuestions: []
          });
        }

        const part = partsMap.get(q.part_number)!;

        if (q.is_part_a) {
            part.question1Number = q.question_number;
            part.subQuestions.push({
                label: q.sub_question_label,
                marks: q.max_marks,
                bloomsLevel: q.blooms_level,
                courseOutcomeId: q.course_outcome_id
            });
        } else {
            part.question2Number = q.question_number;
        }
      });

      setQuestionParts(Array.from(partsMap.values()).sort((a, b) => a.partNumber - b.partNumber));

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseOutcomes = async (courseId: string) => {
    if (!courseId) return;
    try {
      const response = await fetch(`/api/course-outcomes?courseId=${courseId}`);
      const result = await response.json();
      setCourseOutcomes(result.data || []);
    } catch {
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

    setSaving(true);

    try {
      const response = await fetch(`/api/assessments/cie/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_type: assessmentType,
          total_marks: totalMarks,
          question_parts: questionParts
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assessment');
      }

      toast.success('Assessment updated successfully');
      router.back();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Assessment</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Course</Label>
                <div className="font-medium mt-1">{assessmentData?.course_class_assignments?.courses?.course_name}</div>
            </div>
            <div>
                <Label>Class</Label>
                <div className="font-medium mt-1">
                    Sem {assessmentData?.course_class_assignments?.classes?.semester} {assessmentData?.course_class_assignments?.classes?.section}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
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

      <div className="flex gap-4 mt-6 justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
             <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
             </>
          ) : 'Update Assessment'}
        </Button>
      </div>
    </div>
  );
}