// src/app/(main)/assessments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CourseAssignment {
  id: string;
  courses: {
    course_name: string;
    course_code: string;
  };
  classes: {
    semester: number;
    section: string;
    branches: {
      name: string;
    };
  };
  academic_year: string;
}

export default function AssessmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseAssignments();
  }, []);

  const fetchCourseAssignments = async () => {
    try {
      const response = await fetch(`/api/course-assignments?facultyId=${session?.user?.id}`);
      const result = await response.json();
      setCourseAssignments(result.data || []);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assessments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courseAssignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {assignment.courses.course_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {assignment.courses.course_code}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Class:</strong> Sem {assignment.classes.semester} - {assignment.classes.section}
                </p>
                <p>
                  <strong>Branch:</strong> {assignment.classes.branches.name}
                </p>
                <p>
                  <strong>Academic Year:</strong> {assignment.academic_year}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/assessments/create/cie?assignmentId=${assignment.id}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add CIE Assessment
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/assessments/create/see?assignmentId=${assignment.id}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add SEE Assessment
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => router.push(`/assessments/view?assignmentId=${assignment.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Assessments
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
