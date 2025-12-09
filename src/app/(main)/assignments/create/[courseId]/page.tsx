"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ courseId: string }>();

  const courseId = params.courseId;
  const branchId = searchParams.get("branchId") ?? "";
  const semester = searchParams.get("semester") ?? "";
  const schemeId = searchParams.get("schemeId") ?? "";
  const academicYear = searchParams.get("academicYear") ?? ""; // optional, you can add this later

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [totalMarks, setTotalMarks] = React.useState("100");
  const [dueDate, setDueDate] = React.useState("");
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");

  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !branchId || !semester) {
      toast.error("Missing course / branch / semester context");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          branchId,
          semester: Number(semester),
          schemeId: schemeId || null,
          academicYear: academicYear || null,
          title,
          description,
          totalMarks: Number(totalMarks) || 100,
          status,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create assignment");
        return;
      }

      toast.success("Assignment created");
      router.push("/assignments");
    } catch (err) {
      toast.error("Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Assignment
        </h1>
        <p className="text-sm text-muted-foreground">
          Shared for the selected course, branch, academic year, and semester.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Context summary (read-only) */}
        <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Course ID:</span> {courseId}
          </p>
          <p>
            <span className="font-medium">Branch ID:</span> {branchId}
          </p>
          <p>
            <span className="font-medium">Semester:</span> {semester}
          </p>
          {academicYear && (
            <p>
              <span className="font-medium">Academic year:</span> {academicYear}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment on CO mapping..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the assignment..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Total marks</label>
            <Input
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Due date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </div>
      </form>
    </div>
  );
}
