"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Calculator, BookOpen, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import COAttainmentTable from "@/components/assessments/co-attainment-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AttainmentResponse {
  meta: {
    assessmenttype: string;
    coursename: string;
    coursecode: string;
    classname: string;
    branch: string;
    academicyear: string;
    targetpercentage: number;
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
      const res = await fetch(`/api/assessments/cie/${assessmentId}/attainment`);
      const json = await res.json();

      if (res.ok) {
        setData(json);
        toast.success("Attainment recalculated successfully");
      } else {
        toast.error(json.error || "Failed to recalculate attainment");
      }
    } catch (error) {
      toast.error("Failed to recalculate attainment");
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

  if (!data) {
    return <div className="p-6 text-center">No data found</div>;
  }

  // Safely access arrays with fallbacks
  const poAttainments = data.poattainments || [];
  const coAttainments = data.coattainments || [];
  const studentPerformance = data.studentperformance || [];

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
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> {data.meta?.coursename || "N/A"}
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> {data.meta?.branch || ""} - {data.meta?.classname || ""}
              </span>
              <span className="text-gray-300">|</span>
              <span>{data.meta?.academicyear || ""}</span>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assessment Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.meta?.assessmenttype || "N/A"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Target Threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.meta?.targetpercentage || 0}%</div>
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
                    <TableRow>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>USN</TableHead>
                      <TableHead>Name</TableHead>
                      {coAttainments.map((co: any) => (
                        <TableHead key={co.courseoutcomeid} className="text-center">
                          {co.conumber}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentPerformance.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.usn}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        {student.cos.map((co: any, idx: number) => (
                          <TableCell key={idx} className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {co.percentage.toFixed(0)}%
                              </span>
                              {co.attained ? (
                                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Y</Badge>
                              ) : (
                                <Badge variant="outline" className="border-red-200 text-red-400 bg-red-50">N</Badge>
                              )}
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
