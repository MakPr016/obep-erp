// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Plus, FileText, Loader2 } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { toast } from 'sonner';
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from '@/components/ui/select';

// interface Course {
//   id: string;
//   course_name: string;
//   course_code: string;
//   branch: { name: string } | null;
//   semester: number;
//   academic_year: string;
//   scheme_name?: string;
// }

// interface FilterOption {
//   value: string | number;
//   label: string;
// }

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
  branch_name?: string;
  semester: number;
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

  const [schemes, setSchemes] = useState<FilterOption[]>([]);
  const [branches, setBranches] = useState<FilterOption[]>([]);
  const [semesters, setSemesters] = useState<FilterOption[]>([]);

  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchSchemes();
  }, []);

  useEffect(() => {
    if (selectedScheme) {
      fetchBranches(selectedScheme);
    } else {
      setBranches([]);
    }
    setSelectedBranch('');
  }, [selectedScheme]);

  const fetchSchemes = async () => {
    setLoadingSchemes(true);
    try {
      const res = await fetch('/api/courses/filters');
      const data = await res.json();
      setSchemes(
        data.schemes?.map((s: any) => ({
          value: s.id,
          label: s.name,
        })) || []
      );
      setSemesters(data.semesters || []);
    } catch {
      toast.error('Failed to load schemes');
    } finally {
      setLoadingSchemes(false);
    }
  };

  const fetchBranches = async (schemeId: string) => {
    setLoadingBranches(true);
    try {
      const res = await fetch(`/api/courses/filters?schemeId=${schemeId}`);
      const data = await res.json();
      setBranches(
        data.branches.map((b: any) => ({
          value: b.id,
          label: b.name,
        })) || []
      );
    } catch {
      toast.error('Failed to load branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchFilteredCourses = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (selectedSemester) params.append('semester', selectedSemester);
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

      <div className="flex space-x-4 mb-6 max-w-4xl">
        <div className="w-64">
          <Select value={selectedScheme} onValueChange={setSelectedScheme} disabled={loadingSchemes}>
            <SelectTrigger>
              {loadingSchemes ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select Scheme" />
              )}
            </SelectTrigger>
            <SelectContent>
              {schemes.map((scheme) => (
                <SelectItem key={scheme.value} value={scheme.value.toString()}>
                  {scheme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-64">
          <Select
            value={selectedBranch}
            onValueChange={setSelectedBranch}
            disabled={!selectedScheme || loadingBranches}
          >
            <SelectTrigger>
              {loadingBranches ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select Branch" />
              )}
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.value} value={branch.value.toString()}>
                  {branch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select
            value={selectedSemester}
            onValueChange={setSelectedSemester}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((sem) => (
                <SelectItem key={sem.value} value={sem.value.toString()}>
                  {sem.label}
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
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No courses found for selected filters.
            </div>
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
                      <strong>Branch:</strong> {course.branch_name || '-'}
                    </p>
                    <p>
                      <strong>Semester:</strong> {course.semester}
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
