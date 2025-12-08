"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface COAttainment {
  courseoutcomeid: string;
  conumber: string;
  description?: string;
  studentsattempted: number;
  studentsattained: number;
  attainmentpercentage: number;
  attainmentlevel: 0 | 1 | 2 | 3;
}

interface COAttainmentTableProps {
  attainments: COAttainment[];
  assessmentType?: string;
}

function AttainmentLevelBadge({ level }: { level: 0 | 1 | 2 | 3 }) {
  const variants = {
    0: "destructive",
    1: "secondary",
    2: "default", 
    3: "default",
  } as const;

  const colors = {
    0: "bg-red-500",
    1: "bg-orange-500",
    2: "bg-yellow-500",
    3: "bg-green-500",
  };

  return (
    <Badge className={`${colors[level]} text-white hover:${colors[level]}`}>
      Level {level}
    </Badge>
  );
}

export default function COAttainmentTable({ attainments, assessmentType }: COAttainmentTableProps) {
  if (!attainments || attainments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No CO attainment data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          CO Attainment Results {assessmentType ? `- ${assessmentType}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CO Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Attempted</TableHead>
              <TableHead className="text-center">Attained</TableHead>
              <TableHead className="text-center">Percentage</TableHead>
              <TableHead className="text-center">Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attainments.map((co) => (
              <TableRow key={co.courseoutcomeid}>
                <TableCell className="font-medium">{co.conumber}</TableCell>
                <TableCell className="max-w-md truncate" title={co.description || ""}>
                  {co.description || "-"}
                </TableCell>
                <TableCell className="text-center">{co.studentsattempted ?? 0}</TableCell>
                <TableCell className="text-center">{co.studentsattained ?? 0}</TableCell>
                <TableCell className="text-center font-semibold">
                  {/* Safe Access Check for toFixed */}
                  {(typeof co.attainmentpercentage === 'number' 
                      ? co.attainmentpercentage 
                      : 0
                  ).toFixed(2)}%
                </TableCell>
                <TableCell className="text-center">
                  <AttainmentLevelBadge level={co.attainmentlevel ?? 0} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
