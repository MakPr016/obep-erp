// src/app/(main)/assignments/[id]/page.tsx
"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type AssignmentDetail = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED";
  totalMarks: number;
  dueDate: string | null;
  courseCode: string;
  courseName: string;
  branchName: string;
  academicYear: string;
  semester: number;
};

export default function AssignmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [assignment, setAssignment] = React.useState<AssignmentDetail | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assignments/${id}`);
        if (res.status === 404) {
          notFound();
          return;
        }
        if (!res.ok) throw new Error("Failed to load assignment");
        const data: AssignmentDetail = await res.json();
        setAssignment(data);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  }
  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }
  if (!assignment) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {assignment.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {assignment.courseCode} – {assignment.courseName} ·{" "}
            {assignment.branchName} · {assignment.academicYear} · Sem{" "}
            {assignment.semester}
          </p>
        </div>

        <div className="space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/assignments/${assignment.id}/edit`}>Edit</Link>
          </Button>
          <Button asChild size="sm">
            {/* later: list sections (classes) under this branch/year/sem */}
            <Link href={`/assignments/${assignment.id}/classes`}>
              Section-wise marks
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border p-4 space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="text-sm text-muted-foreground">
            {assignment.description || "No description provided."}
          </p>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-semibold">Meta</h2>
          <p className="text-sm">
            Status: <span className="font-medium">{assignment.status}</span>
          </p>
          <p className="text-sm">
            Total marks:{" "}
            <span className="font-medium">{assignment.totalMarks}</span>
          </p>
          <p className="text-sm">
            Due date:{" "}
            <span className="font-medium">
              {assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleDateString()
                : "Not set"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
