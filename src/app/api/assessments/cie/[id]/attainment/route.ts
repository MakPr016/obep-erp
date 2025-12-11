import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  groupQuestionsByCO,
  calculatePOAttainment,
  calculateCoAttainmentStudentWise,
  type COAttainment,
} from "@/lib/services/attainment-calculator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const searchParams = request.nextUrl.searchParams;
    const filterType = searchParams.get("filterType") || "class";
    let classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const branchId = searchParams.get("branchId");
    const semester = searchParams.get("semester");

    const { data: assessment, error: assessmentError } = await supabase
      .from("cie_assessments")
      .select(`
        *,
        course_class_assignments!inner(
          id,
          class_id,
          academic_year,
          courses!inner(id, course_name, course_code, set_target_percentage),
          classes!inner(id, semester, section, branch_id, branches!inner(name))
        )
      `)
      .eq("id", id)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (filterType === "class" && !classId) {
      const courseClassAssignment = assessment.course_class_assignments as any;
      classId = courseClassAssignment?.class_id;
      
      if (!classId) {
        return NextResponse.json(
          { error: "Unable to determine class for this assessment" },
          { status: 400 }
        );
      }
    }

    const targetThreshold =
      (assessment.course_class_assignments as any)?.courses?.set_target_percentage || 0.6;

    const { data: questions, error: questionsError } = await supabase
      .from("cie_questions")
      .select(`
        id,
        question_number,
        max_marks,
        part_number,
        course_outcome_id,
        course_outcomes!inner(id, co_number, description)
      `)
      .eq("cie_assessment_id", id);

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }

    const questionIds = questions.map((q) => q.id);

    let marksQuery = supabase
      .from("cie_student_marks")
      .select(`
        cie_question_id,
        student_id,
        marks_obtained,
        students!inner(usn, name, class_id, classes!inner(branch_id, semester, section))
      `)
      .in("cie_question_id", questionIds);

    switch (filterType) {
      case "student":
        if (!studentId) {
          return NextResponse.json(
            { error: "studentId is required for student filter" },
            { status: 400 }
          );
        }
        marksQuery = marksQuery.eq("student_id", studentId);
        break;

      case "class":
        marksQuery = marksQuery.eq("students.class_id", classId);
        break;

      case "semester":
        if (!branchId || !semester) {
          return NextResponse.json(
            { error: "branchId and semester are required for semester filter" },
            { status: 400 }
          );
        }
        marksQuery = marksQuery
          .eq("students.classes.branch_id", branchId)
          .eq("students.classes.semester", parseInt(semester));
        break;

      default:
        return NextResponse.json(
          { error: "Invalid filterType. Must be: class, semester, or student" },
          { status: 400 }
        );
    }

    const { data: marks, error: marksError } = await marksQuery;

    if (marksError) {
      return NextResponse.json({ error: marksError.message }, { status: 500 });
    }

    const marksArr = marks as any[];

    const coQuestionMap = groupQuestionsByCO(
      questions.map((q) => ({
        id: q.id,
        courseoutcomeid: q.course_outcome_id,
      }))
    );

    const coAttainments: COAttainment[] = [];
    const coResultsForPO: { coid: string; conumber: string; attainmentlevel: number }[] = [];
    const studentPerformance: any[] = [];

    const allStudentIds = [...new Set(marksArr.map((m: any) => m.student_id))];

    for (const studentId of allStudentIds) {
      const studentMarksRaw = marksArr.filter((m: any) => m.student_id === studentId);
      const studentInfo = studentMarksRaw[0]?.students;
      const studentName = Array.isArray(studentInfo)
        ? studentInfo[0]?.name
        : studentInfo?.name;
      const studentUsn = Array.isArray(studentInfo)
        ? studentInfo[0]?.usn
        : studentInfo?.usn;

      const attainedCOs: any[] = [];

      for (const [coId, questionIdsForCO] of coQuestionMap.entries()) {
        const questionsForCO = questions.filter((q) =>
          questionIdsForCO.includes(q.id)
        );

        let totalObtained = 0;
        let totalMax = 0;

        const partsInCO = [...new Set(questionsForCO.map((q) => q.part_number))];

        partsInCO.forEach((partNum) => {
          const questionsInPart = questionsForCO.filter((q) => q.part_number === partNum);
          const attemptsInPart = studentMarksRaw.filter((m: any) =>
            questionsInPart.some((q) => q.id === m.cie_question_id)
          );

          if (attemptsInPart.length > 0) {
            totalMax += Number(questionsInPart[0].max_marks);
            totalObtained += attemptsInPart.reduce(
              (sum: number, m: any) => sum + Number(m.marks_obtained || 0),
              0
            );
          }
        });

        const percentage = totalMax > 0 ? totalObtained / totalMax : 0;
        const firstQuestion = questionsForCO[0];
        const coRelation = firstQuestion.course_outcomes;
        const coDetails = Array.isArray(coRelation) ? coRelation[0] : coRelation;

        attainedCOs.push({
          conumber: coDetails?.co_number,
          percentage: percentage * 100,
          attained: percentage >= targetThreshold,
        });
      }

      studentPerformance.push({
        id: studentId,
        name: studentName,
        usn: studentUsn,
        cos: attainedCOs,
      });
    }

    for (const [coId, questionIdsForCO] of coQuestionMap.entries()) {
      const questionsForCO = questions.filter((q) => questionIdsForCO.includes(q.id));

      const studentIds = [
        ...new Set(
          marksArr
            .filter((m: any) => questionIdsForCO.includes(m.cie_question_id))
            .map((m: any) => m.student_id)
        ),
      ];

      const studentData = studentIds.map((studentId) => {
        const studentMarks = marksArr.filter((m: any) => m.student_id === studentId);

        let totalObtained = 0;
        let totalMax = 0;

        const partsInCO = [...new Set(questionsForCO.map((q) => q.part_number))];

        partsInCO.forEach((partNum) => {
          const questionsInPart = questionsForCO.filter((q) => q.part_number === partNum);
          const attemptsInPart = studentMarks.filter((m: any) =>
            questionsInPart.some((q) => q.id === m.cie_question_id)
          );

          if (attemptsInPart.length > 0) {
            totalMax += Number(questionsInPart[0].max_marks);
            totalObtained += attemptsInPart.reduce(
              (sum: number, m: any) => sum + Number(m.marks_obtained || 0),
              0
            );
          }
        });

        return {
          studentid: studentId,
          totalmarksobtained: totalObtained,
          totalmaxmarks: totalMax,
        };
      });

      const result = calculateCoAttainmentStudentWise(studentData, targetThreshold);

      const firstQuestion = questionsForCO[0];
      const coRelation = firstQuestion.course_outcomes;
      const coDetails = Array.isArray(coRelation) ? coRelation[0] : coRelation;

      const coData: COAttainment = {
        courseoutcomeid: coId,
        conumber: coDetails?.co_number || "Unknown",
        description: coDetails?.description || "",
        studentsattempted: result.studentsattempted,
        studentsattained: result.studentsattained,
        attainmentpercentage: result.percentage,
        attainmentlevel: result.level,
      };

      coAttainments.push(coData);
      coResultsForPO.push({
        coid: coId,
        conumber: coData.conumber,
        attainmentlevel: coData.attainmentlevel,
      });
    }

    const { data: mappings } = await supabase
      .from("co_po_mappings")
      .select(`
        course_outcome_id,
        mapping_strength,
        program_outcomes!inner(id, po_number, description)
      `)
      .in("course_outcome_id", Array.from(coQuestionMap.keys()));

    type PoMapping = {
      coid: string;
      poid: string;
      ponumber: string;
      podescription: string;
      strength: number;
    };

    const flatMappings: PoMapping[] =
      (mappings ?? []).reduce((acc: PoMapping[], m: any) => {
        const poRelation = m.program_outcomes;
        const po = Array.isArray(poRelation) ? poRelation[0] : poRelation;
        if (!po) return acc;

        acc.push({
          coid: m.course_outcome_id,
          poid: po.id,
          ponumber: po.po_number,
          podescription: po.description,
          strength: Number(m.mapping_strength ?? 0),
        });
        return acc;
      }, [] as PoMapping[]);

    const poAttainments = calculatePOAttainment(coResultsForPO, flatMappings);

    if (filterType === "class") {
      const courseClassAssignmentId = (assessment as any).course_class_assignment_id;
      if (courseClassAssignmentId) {
        const attainmentRecords = coAttainments.map((co) => ({
          course_class_assignment_id: courseClassAssignmentId,
          course_outcome_id: co.courseoutcomeid,
          assessment_type: (assessment as any).assessment_type,
          students_attempted: co.studentsattempted,
          students_attained: co.studentsattained,
          attainment_percentage: co.attainmentpercentage,
          attainment_level: co.attainmentlevel,
        }));

        await supabase
          .from("co_attainment_results")
          .delete()
          .eq("course_class_assignment_id", courseClassAssignmentId)
          .eq("assessment_type", (assessment as any).assessment_type);

        if (attainmentRecords.length > 0) {
          await supabase.from("co_attainment_results").insert(attainmentRecords);
        }
      }
    }

    const cca = assessment.course_class_assignments as any;

    return NextResponse.json({
      meta: {
        assessmenttype: (assessment as any).assessment_type,
        coursename: cca?.courses?.course_name,
        branch: cca?.classes?.branches?.name,
        classname: `${cca?.classes?.semester}${cca?.classes?.section}`,
        academicyear: cca?.academic_year,
        targetpercentage: targetThreshold * 100,
        filterType,
        ...(filterType === "semester" && { semester, branchId }),
        ...(filterType === "student" && { studentId }),
        ...(filterType === "class" && { classId }),
      },
      coattainments: coAttainments.sort((a, b) =>
        a.conumber.localeCompare(b.conumber)
      ),
      poattainments: poAttainments,
      studentperformance: studentPerformance.sort((a, b) =>
        a.usn.localeCompare(b.usn)
      ),
    });
  } catch (error: any) {
    console.error("Attainment calculation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
