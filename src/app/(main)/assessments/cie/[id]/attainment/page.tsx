"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calculator, Filter } from "lucide-react";
import { toast } from "sonner";
import COAttainmentTable from "@/components/assessments/co-attainment-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AttainmentResponse {
  meta: {
    assessmenttype: string;
    coursename: string;
    coursecode: string;
    classname: string;
    branch: string;
    academicyear: string;
    targetpercentage: number;
    filterType: string;
  };
  coattainments: any[];
  poattainments: any[];
  studentperformance: any[];
}

export default function CIEAttainmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [data, setData] = useState<AttainmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<"class" | "semester" | "student">("class");
  const [schemes, setSchemes] = useState<any[]>([]);
  const [selectedScheme, setSelectedScheme] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [studentScheme, setStudentScheme] = useState("");
  const [studentBranch, setStudentBranch] = useState("");
  const [studentSemester, setStudentSemester] = useState("");
  const [studentSection, setStudentSection] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    fetchAttainment();
  }, [assessmentId]);

  useEffect(() => {
    if (filterType === "semester") {
      fetchSchemes();
      if (selectedScheme) {
        fetchBranches(selectedScheme);
      } else {
        setBranches([]);
      }
    } else if (filterType === "class") {
      fetchClasses();
    } else if (filterType === "student") {
      fetchSchemes();
      fetchClasses();
      if (studentScheme) {
        fetchBranches(studentScheme);
      } else {
        setBranches([]);
      }
      setStudents([]);
      setSelectedStudent("");
    }
  }, [filterType, selectedScheme, studentScheme]);

  const fetchSchemes = async () => {
    try {
      const res = await fetch("/api/schemes");
      const json = await res.json();
      setSchemes(json.schemes || []);
    } catch (error) {
      toast.error("Failed to load schemes");
    }
  };

  const fetchBranches = async (schemeId?: string) => {
    try {
      if (!schemeId) return;
      const res = await fetch(`/api/branches?schemeId=${schemeId}`);
      const json = await res.json();
      setBranches(json.branches || []);
    } catch (error) {
      toast.error("Failed to load branches");
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const json = await res.json();
      // Handle both array and object response formats
      const classesData = Array.isArray(json) ? json : (json.classes || json.data || []);
      setClasses(classesData);
    } catch (error) {
      toast.error("Failed to load classes");
    }
  };

  const fetchStudents = async (classId?: string) => {
    try {
      if (!classId) return setStudents([]);
      const res = await fetch(`/api/students?classid=${classId}&limit=500`);
      const json = await res.json();
      setStudents(json.students || []);
    } catch (error) {
      toast.error("Failed to load students");
    }
  };

  const fetchAttainment = async () => {
    setLoading(true);
    try {
      let url = `/api/assessments/cie/${assessmentId}/attainment?filterType=${filterType}`;

      if (filterType === "semester") {
        if (!selectedScheme) {
          toast.error("Please select a scheme");
          setLoading(false);
          return;
        }
        if (selectedBranch && selectedSemester) {
          url += `&branchId=${selectedBranch}&semester=${selectedSemester}`;
        }
      } else if (filterType === "class" && selectedClass) {
        url += `&classId=${selectedClass}`;
      } else if (filterType === "student") {
        if (!studentScheme) {
          toast.error("Please select a scheme");
          setLoading(false);
          return;
        }
        if (!studentBranch || !studentSemester || !studentSection || !selectedStudentClassId) {
          toast.error("Please select branch, semester, and section");
          setLoading(false);
          return;
        }
        if (selectedStudent) {
          url += `&studentId=${selectedStudent}`;
        } else {
          toast.error("Please select a student");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(url);
      const json = await res.json();

      if (res.ok) {
        setData(json);
      } else {
        toast.error(json.error || "Failed to load attainment data");
      }
    } catch (error) {
      console.error("Error fetching attainment:", error);
      toast.error("Failed to load attainment data");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      await fetchAttainment();
      toast.success("Attainment recalculated successfully");
    } catch (error) {
      toast.error("Failed to recalculate attainment");
    } finally {
      setCalculating(false);
    }
  };

  const selectedStudentClassId = classes.find(
    (cls: any) =>
      cls.branch_id === studentBranch &&
      String(cls.semester) === String(studentSemester) &&
      cls.section === studentSection
  )?.id;

  useEffect(() => {
    if (
      filterType === "student" &&
      studentBranch &&
      studentSemester &&
      studentSection &&
      selectedStudentClassId
    ) {
      fetchStudents(selectedStudentClassId);
    }
  }, [filterType, studentBranch, studentSemester, studentSection, selectedStudentClassId]);
  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <div className="p-6 text-center">No data found</div>;

  const poAttainments = data.poattainments || [];
  const coAttainments = data.coattainments || [];
  const studentPerformance = data.studentperformance || [];

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assessment Attainment</h1>
            <div className="text-sm text-muted-foreground mt-1">
              {data.meta?.coursename} • {data.meta?.branch} - {data.meta?.classname}
            </div>
          </div>
        </div>
        <Button onClick={handleRecalculate} disabled={calculating}>
          {calculating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          Recalculate
        </Button>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Attainment Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Filter By</Label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Specific Class</SelectItem>
                  <SelectItem value="semester">Whole Semester/Branch</SelectItem>
                  <SelectItem value="student">Individual Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "semester" && (
              <>
                <div className="space-y-2">
                  <Label>Scheme</Label>
                  <Select
                    value={selectedScheme}
                    onValueChange={(val) => {
                      setSelectedScheme(val);
                      setSelectedBranch("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {schemes.map((scheme) => (
                        <SelectItem key={scheme.id} value={scheme.id}>
                          {scheme.name} ({scheme.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={selectedBranch}
                    onValueChange={setSelectedBranch}
                    disabled={!selectedScheme}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedScheme ? "Select Branch" : "Select scheme first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {filterType === "class" && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.semester}{cls.section} - {cls.academic_year || cls.academicyear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === "student" && (
              <>
                <div className="space-y-2">
                  <Label>Scheme</Label>
                  <Select
                    value={studentScheme}
                    onValueChange={(val) => {
                      setStudentScheme(val);
                      setStudentBranch("");
                      setStudentSemester("");
                      setStudentSection("");
                      setStudents([]);
                      setSelectedStudent("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {schemes.map((scheme) => (
                        <SelectItem key={scheme.id} value={scheme.id}>
                          {scheme.name} ({scheme.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={studentBranch}
                    onValueChange={(val) => {
                      setStudentBranch(val);
                      setStudentSemester("");
                      setStudentSection("");
                      setStudents([]);
                      setSelectedStudent("");
                    }}
                    disabled={!studentScheme}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={studentScheme ? "Select Branch" : "Select scheme first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select
                    value={studentSemester}
                    onValueChange={(val) => {
                      setStudentSemester(val);
                      setStudentSection("");
                      setStudents([]);
                      setSelectedStudent("");
                    }}
                    disabled={!studentBranch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={studentBranch ? "Select Semester" : "Select branch first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={studentSection}
                    onValueChange={(val) => {
                      setStudentSection(val);
                      setStudents([]);
                      setSelectedStudent("");
                    }}
                    disabled={!studentSemester}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={studentSemester ? "Select Section" : "Select semester first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes
                        .filter(
                          (cls: any) =>
                            cls.branch_id === studentBranch &&
                            String(cls.semester) === String(studentSemester)
                        )
                        .map((cls: any) => cls.section)
                        .filter((val, idx, arr) => arr.indexOf(val) === idx)
                        .map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                    disabled={!studentSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={studentSection ? "Select Student" : "Select section first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.usn} - {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={fetchAttainment} className="w-full">
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assessment Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.meta?.assessmenttype || "N/A"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.meta?.targetpercentage || 0}%</div>
            <p className="text-xs text-muted-foreground">Marks required to attain CO</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filter Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge>{filterType.toUpperCase()}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="co" className="w-full">
        <TabsList>
          <TabsTrigger value="co">CO Analysis</TabsTrigger>
          <TabsTrigger value="po">PO Analysis</TabsTrigger>
          <TabsTrigger value="student">Student View</TabsTrigger>
        </TabsList>

        <TabsContent value="co" className="space-y-4">
          <COAttainmentTable
            attainments={coAttainments}
            assessmentType={data.meta?.assessmenttype}
          />
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
                  {poAttainments.length === 0 ? (
                    <TableRow key="no-data">
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No PO mappings found for these COs
                      </TableCell>
                    </TableRow>
                  ) : (
                    poAttainments.map((po: any) => (
                      <TableRow key={po.programoutcomeid}>
                        <TableCell className="font-medium">{po.ponumber}</TableCell>
                        <TableCell className="max-w-md truncate" title={po.description}>
                          {po.description}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {po.calculatedattainment}
                        </TableCell>
                        <TableCell className="text-center">
                          {po.calculatedattainment >= 2 ? (
                            <Badge className="bg-green-600">Good</Badge>
                          ) : po.calculatedattainment >= 1 ? (
                            <Badge className="bg-yellow-500">Average</Badge>
                          ) : (
                            <Badge variant="destructive">Low</Badge>
                          )}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>USN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>COs Attained</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentPerformance.map((student: any, idx: number) => (
                    <TableRow key={student.id || `student-${idx}`}>
                      <TableCell className="font-medium">{student.usn}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.cos?.map((co: any) => (
                            <Badge
                              key={co.conumber}
                              variant={co.attained ? "green" : "destructive"}
                            >
                              {co.conumber}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
