// // src/app/(main)/assignments/create/page.tsx
// "use client";

// import * as React from "react";
// import { useRouter } from "next/navigation";
// import { Loader2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { toast } from "sonner";
// import { BloomsCheckButton } from "@/components/tools/blooms-check-button";

// type BloomLevel = "CL1" | "CL2" | "CL3" | "CL4" | "CL5" | "CL6";

// export default function CreateAssignmentPage() {
//   const router = useRouter();

//   // minimal fields; later you can add scheme/branch/semester pickers here too
//   const [title, setTitle] = React.useState("");
//   const [question, setQuestion] = React.useState("");
//   const [bloomLevel, setBloomLevel] = React.useState<BloomLevel | "">("");

//   const [totalMarks, setTotalMarks] = React.useState("10");
//   const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
//   const [dueDate, setDueDate] = React.useState("");

//   const [checkingBloom, setCheckingBloom] = React.useState(false);
//   const [submitting, setSubmitting] = React.useState(false);

//   async function handleCheckBloom() {
//     if (!question.trim()) {
//       toast.error("Enter the assignment question first");
//       return;
//     }
//     setCheckingBloom(true);
//     try {
//       const res = await fetch("/api/blooms/check", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ statement: question }),
//       });
//       if (!res.ok) throw new Error("Failed to analyze Bloom level");
//       const data = await res.json();
//       if (data.suggestedLevel) {
//         setBloomLevel(data.suggestedLevel as BloomLevel);
//         toast.success(`Suggested Bloom level: ${data.suggestedLevel}`);
//       } else {
//         toast.message("No Bloom level suggestion for this statement");
//       }
//     } catch {
//       toast.error("Could not check Bloom level");
//     } finally {
//       setCheckingBloom(false);
//     }
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (!title.trim() || !question.trim()) {
//       toast.error("Title and question are required");
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const res = await fetch("/api/assignments", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           // backend should derive course/branch/semester from context or later add selectors here
//           title,
//           description: question, // treat the question as main description for now
//           totalMarks: Number(totalMarks) || 10,
//           status,
//           dueDate: dueDate || null,
//           bloomLevel: bloomLevel || null,
//         }),
//       });

//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         toast.error(data.error || "Failed to create assignment");
//         return;
//       }

//       toast.success("Assignment created");
//       router.push("/assignments");
//     } catch {
//       toast.error("Failed to create assignment");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div className="container mx-auto p-6 max-w-2xl space-y-6">
//       <div>
//         <h1 className="text-2xl font-semibold tracking-tight">
//           Create Assignment
//         </h1>
//         <p className="text-sm text-muted-foreground">
//           Define the assignment question and Bloom&apos;s level.
//         </p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="space-y-1">
//           <label className="text-sm font-medium">Title</label>
//           <Input
//             required
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             placeholder="Assignment on CO mapping"
//           />
//         </div>

//         <div className="space-y-2">
//           <div className="flex items-center justify-between">
//             <label className="text-sm font-medium">
//               Assignment question / statement
//             </label>
//             <div className="flex items-center gap-2">
//               <BloomsCheckButton
//                 statement={question}
//                 onResult={(level: string) => setBloomLevel(level as BloomLevel)}
//                 disabled={checkingBloom}
//               />
//               {/*<Button
//                 type="button"
//                 variant="outline"
//                 size="sm"
//                 onClick={handleCheckBloom}
//                 disabled={checkingBloom}
//               >
//                 {checkingBloom && (
//                   <Loader2 className="mr-2 h-3 w-3 animate-spin" />
//                 )}
//                 Check Bloom&apos;s
//               </Button>*/}
//             </div>
//           </div>
//           <Textarea
//             required
//             value={question}
//             onChange={(e) => setQuestion(e.target.value)}
//             placeholder="Write the assignment question here..."
//           />
//         </div>

//         <div className="flex gap-4">
//           <div className="flex-1 space-y-1">
//             <label className="text-sm font-medium">Bloom&apos;s level</label>
//             <Select
//               value={bloomLevel}
//               onValueChange={(v) => setBloomLevel(v as BloomLevel)}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select level" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="CL1">CL1 – Remember</SelectItem>
//                 <SelectItem value="CL2">CL2 – Understand</SelectItem>
//                 <SelectItem value="CL3">CL3 – Apply</SelectItem>
//                 <SelectItem value="CL4">CL4 – Analyze</SelectItem>
//                 <SelectItem value="CL5">CL5 – Evaluate</SelectItem>
//                 <SelectItem value="CL6">CL6 – Create</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="flex-1 space-y-1">
//             <label className="text-sm font-medium">Total marks</label>
//             <Input
//               type="number"
//               min={1}
//               value={totalMarks}
//               onChange={(e) => setTotalMarks(e.target.value)}
//             />
//           </div>
//         </div>

//         <div className="flex gap-4">
//           <div className="flex-1 space-y-1">
//             <label className="text-sm font-medium">Due date</label>
//             <Input
//               type="date"
//               value={dueDate}
//               onChange={(e) => setDueDate(e.target.value)}
//             />
//           </div>

//           <div className="flex-1 space-y-1">
//             <label className="text-sm font-medium">Status</label>
//             <Select
//               value={status}
//               onValueChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}
//             >
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="DRAFT">Draft</SelectItem>
//                 <SelectItem value="PUBLISHED">Published</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div className="flex justify-end gap-2 pt-2">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => router.back()}
//             disabled={submitting}
//           >
//             Cancel
//           </Button>
//           <Button type="submit" disabled={submitting}>
//             {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             Save assignment
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }

// src/app/(main)/assignments/create/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { BloomsCheckButton } from "@/components/tools/blooms-check-button";

type BloomLevel = "CL1" | "CL2" | "CL3" | "CL4" | "CL5" | "CL6";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // context from URL – must be non-null
  const courseId = searchParams.get("courseId") ?? "";
  const branchId = searchParams.get("branchId") ?? "";
  const semester = searchParams.get("semester") ?? "";
  const academicYear = searchParams.get("academicYear") ?? "";

  const [title, setTitle] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [bloomLevel, setBloomLevel] = React.useState<BloomLevel | "">("");

  const [totalMarks, setTotalMarks] = React.useState("10");
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [dueDate, setDueDate] = React.useState("");

  const [checkingBloom, setCheckingBloom] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !question.trim()) {
      toast.error("Title and question are required");
      return;
    }

    if (!courseId || !branchId || !semester || !academicYear) {
      toast.error(
        "Missing course / branch / semester / academic year. Open this page from the course card.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: question,
          totalMarks: Number(totalMarks) || 10,
          status,
          dueDate: dueDate || null,
          bloomLevel: bloomLevel || null,
          courseId,
          branchId,
          academicYear,
          semester: Number(semester),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create assignment");
        return;
      }

      toast.success("Assignment created");
      router.push("/assignments");
    } catch {
      toast.error("Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Assignment
        </h1>
        <p className="text-sm text-muted-foreground">
          Define the assignment question and Bloom&apos;s level for the selected
          course and semester.
        </p>
      </div>

      {/* context summary */}
      <div className="rounded-md border p-3 text-xs text-muted-foreground space-y-1">
        <p>
          <span className="font-medium">Course ID:</span>{" "}
          {courseId || "Missing"}
        </p>
        <p>
          <span className="font-medium">Branch ID:</span>{" "}
          {branchId || "Missing"}
        </p>
        <p>
          <span className="font-medium">Semester:</span> {semester || "Missing"}
        </p>
        <p>
          <span className="font-medium">Academic year:</span>{" "}
          {academicYear || "Missing"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment on CO mapping"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Assignment question / statement
            </label>
            <div className="flex items-center gap-2">
              <BloomsCheckButton
                statement={question}
                onResult={(level: string) => setBloomLevel(level as BloomLevel)}
                disabled={checkingBloom}
              />
            </div>
          </div>
          <Textarea
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Write the assignment question here..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Bloom&apos;s level</label>
            <Select
              value={bloomLevel}
              onValueChange={(v) => setBloomLevel(v as BloomLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CL1">CL1 – Remember</SelectItem>
                <SelectItem value="CL2">CL2 – Understand</SelectItem>
                <SelectItem value="CL3">CL3 – Apply</SelectItem>
                <SelectItem value="CL4">CL4 – Analyze</SelectItem>
                <SelectItem value="CL5">CL5 – Evaluate</SelectItem>
                <SelectItem value="CL6">CL6 – Create</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Total marks</label>
            <Input
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Due date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex-1 space-y-1">
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
            Save assignment
          </Button>
        </div>
      </form>
    </div>
  );
}
