// src/app/(main)/assignments/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AssignmentRow = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  totalMarks: number;
  dueDate: string | null;
  courseCode: string;
  courseName: string;
  branchName: string;
  academicYear: string;
  semester: number;
  courseId: string;
  branchId: string;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/assignments");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: AssignmentRow[] = await res.json();
        setAssignments(data);
        setError(null);
      } catch (err: any) {
        console.error("Error loading assignments", err);
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    const ok = confirm(
      "Delete this assignment for this course/branch/year/semester?",
    );
    if (!ok) return;

    const res = await fetch(`/api/assignments/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("Failed to delete assignment");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            One assignment per course, branch, academic year, and semester,
            shared across all sections.
          </p>
        </div>

        <Button asChild>
          <Link href="/assignments/create">
            <Plus className="mr-2 h-4 w-4" />
            New assignment
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : assignments.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No assignments yet. Click &quot;New assignment&quot; to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Course ID</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Branch ID</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.title}</TableCell>
                  <TableCell>
                    {a.courseCode} – {a.courseName}
                  </TableCell>
                  <TableCell>{a.courseId}</TableCell>
                  <TableCell>{a.branchName}</TableCell>
                  <TableCell>{a.branchId}</TableCell>
                  <TableCell>{a.academicYear}</TableCell>
                  <TableCell>{a.semester}</TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/assignments/${a.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/assignments/${a.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
