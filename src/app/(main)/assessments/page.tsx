'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  branch: { name: string } | null;
  semester: number;
  academic_year: string;
  scheme_name?: string;
}

interface FilterOption {
  value: string | number;
  label: string;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    branches: [] as FilterOption[],
    semesters: [] as FilterOption[],
    schemes: [] as FilterOption[],
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const res = await fetch('/api/courses/filters');
      const data = await res.json();
      setFilters({
        branches:
          data.branches.map((b: any) => ({
            value: b.id,
            label: b.name,
          })) || [],
        semesters: data.semesters || [],
        schemes:
          data.schemes?.map((s: any) => ({
            value: s.id,
            label: s.name,
          })) || [],
      });
    } catch {
      toast.error('Failed to load filters');
    }
  };

  const fetchFilteredCourses = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (selectedSemester) params.append('semester', selectedSemester.toString());
      if (selectedScheme) params.append('schemeId', selectedScheme);
      const res = await fetch(`/api/courses?${params.toString()}`);
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Assessments</h1>

      <div className="flex space-x-4 mb-6 max-w-xl">
        <div className="flex-1">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger>
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {filters.branches.map((branch) => (
                <SelectItem key={branch.value} value={branch.value.toString()}>
                  {branch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select
            value={selectedSemester === '' ? '' : selectedSemester.toString()}
            onValueChange={(val) =>
              setSelectedSemester(val === '' ? '' : Number(val))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {filters.semesters.map((sem) => (
                <SelectItem key={sem.value} value={sem.value.toString()}>
                  {sem.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={selectedScheme} onValueChange={setSelectedScheme}>
            <SelectTrigger>
              <SelectValue placeholder="Select Scheme" />
            </SelectTrigger>
            <SelectContent>
              {filters.schemes.map((scheme) => (
                <SelectItem key={scheme.value} value={scheme.value.toString()}>
                  {scheme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="min-w-[100px]"
          onClick={fetchFilteredCourses}
          disabled={loading || !selectedBranch || !selectedSemester || !selectedScheme}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span>Search</span>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center my-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searched && courses.length === 0 ? (
            <p>No courses found for selected filters.</p>
          ) : (
            courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{course.course_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{course.course_code}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Branch:</strong> {course.branch?.name || '-'}
                    </p>
                    <p>
                      <strong>Semester:</strong> {course.semester}
                    </p>
                    <p>
                      <strong>Academic Year:</strong> {course.academic_year || 'N/A'}
                    </p>
                    <p>
                      <strong>Scheme:</strong> {course.scheme_name || '-'}
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() =>
                        router.push(`/assessments/create/cie?courseId=${course.id}`)
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add CIE Assessment
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() =>
                        router.push(`/assessments/create/see?courseId=${course.id}`)
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add SEE Assessment
                    </Button>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() =>
                        router.push(`/assessments/view?courseId=${course.id}`)
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Assessments
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
