import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  groupQuestionsByCO, 
  calculatePOAttainment, 
  calculateCoAttainmentStudentWise,
  type COAttainment 
} from "@/lib/services/attainment-calculator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: assessment, error: assessmentError } = await supabase
      .from("cieassessments")
      .select(`
        *,
        courseclassassignments (
          id,
          academicyear,
          courses(id, coursename, coursecode, settargetpercentage),
          classes(id, semester, section),
          branches(name)
        )
      `)
      .eq("id", id)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const targetThreshold = assessment.courseclassassignments?.courses?.settargetpercentage || 0.5;

    const { data: questions, error: questionsError } = await supabase
      .from("ciequestions")
      .select(`
        id,
        questionnumber,
        maxmarks,
        partnumber,
        courseoutcomeid,
        courseoutcomes(id, conumber, description)
      `)
      .eq("cieassessmentid", id);

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }

    const questionIds = questions.map(q => q.id);

    const { data: marks, error: marksError } = await supabase
      .from("ciestudentmarks")
      .select("ciequestionid, studentid, marksobtained, students(usn, name)")
      .in("ciequestionid", questionIds);

    if (marksError) {
      return NextResponse.json({ error: marksError.message }, { status: 500 });
    }

    const marksArr = (marks || []) as any[];
    
    const coQuestionMap = groupQuestionsByCO(questions.map(q => ({
      id: q.id, 
      courseoutcomeid: q.courseoutcomeid 
    })));

    const coAttainments: COAttainment[] = [];
    const coResultsForPO: { coid: string; conumber: string; attainmentlevel: number }[] = [];
    const studentPerformance: any[] = [];

    const allStudentIds = [...new Set(marksArr.map((m: any) => m.studentid))];

    for (const studentId of allStudentIds) {
        const studentMarksRaw = marksArr.filter((m: any) => m.studentid === studentId);
        const studentInfo = studentMarksRaw[0]?.students;
        const studentName = Array.isArray(studentInfo) ? studentInfo[0]?.name : studentInfo?.name;
        const studentUsn = Array.isArray(studentInfo) ? studentInfo[0]?.usn : studentInfo?.usn;
        
        const attainedCOs: any[] = [];
        
        for (const [coId, questionIdsForCO] of coQuestionMap.entries()) {
             const questionsForCO = questions.filter(q => questionIdsForCO.includes(q.id));
             
             let totalObtained = 0;
             let totalMax = 0;

             const partsInCO = [...new Set(questionsForCO.map(q => q.partnumber))];

             partsInCO.forEach(partNum => {
                 const questionsInPart = questionsForCO.filter(q => q.partnumber === partNum);
                 
                 const attemptsInPart = studentMarksRaw.filter((m: any) => 
                     questionsInPart.some(q => q.id === m.ciequestionid)
                 );

                 if (attemptsInPart.length > 0) {
                     totalMax += questionsInPart[0].maxmarks;
                     totalObtained += attemptsInPart.reduce((sum: number, m: any) => 
                         sum + (m.marksobtained || 0), 0
                     );
                 }
             });
             
             const percentage = totalMax > 0 ? (totalObtained / totalMax) : 0;
             const firstQuestion = questionsForCO[0];
             const coDetails = Array.isArray(firstQuestion?.courseoutcomes) 
                ? firstQuestion.courseoutcomes[0] 
                : firstQuestion?.courseoutcomes;
                
             attainedCOs.push({
                 conumber: coDetails?.conumber,
                 percentage: percentage * 100,
                 attained: percentage >= targetThreshold
             });
        }
        
        studentPerformance.push({
            id: studentId,
            name: studentName,
            usn: studentUsn,
            cos: attainedCOs
        });
    }

    for (const [coId, questionIdsForCO] of coQuestionMap.entries()) {
      const questionsForCO = questions.filter(q => questionIdsForCO.includes(q.id));
      
      const studentIds = [...new Set(marksArr
        .filter((m: any) => questionIdsForCO.includes(m.ciequestionid))
        .map((m: any) => m.studentid))];

      const studentData = studentIds.map(studentId => {
        const studentMarks = marksArr.filter((m: any) => m.studentid === studentId);
        
        let totalObtained = 0;
        let totalMax = 0;

        const partsInCO = [...new Set(questionsForCO.map(q => q.partnumber))];

        partsInCO.forEach(partNum => {
          const questionsInPart = questionsForCO.filter(q => q.partnumber === partNum);
          const attemptsInPart = studentMarks.filter((m: any) => 
            questionsInPart.some(q => q.id === m.ciequestionid)
          );

          if (attemptsInPart.length > 0) {
            totalMax += questionsInPart[0].maxmarks;
            totalObtained += attemptsInPart.reduce((sum: number, m: any) => 
              sum + (m.marksobtained || 0), 0
            );
          }
        });

        return {
          studentid: studentId,
          totalmarksobtained: totalObtained,
          totalmaxmarks: totalMax
        };
      });

      const result = calculateCoAttainmentStudentWise(studentData, targetThreshold);

      const firstQuestion = questionsForCO[0];
      const coDetails = Array.isArray(firstQuestion?.courseoutcomes) 
        ? firstQuestion.courseoutcomes[0] 
        : firstQuestion?.courseoutcomes;

      const coData: COAttainment = {
        courseoutcomeid: coId,
        conumber: coDetails?.conumber || "Unknown",
        description: coDetails?.description || "",
        studentsattempted: result.studentsattempted,
        studentsattained: result.studentsattained,
        attainmentpercentage: result.percentage,
        attainmentlevel: result.level
      };

      coAttainments.push(coData);
      coResultsForPO.push({
        coid: coId,
        conumber: coData.conumber,
        attainmentlevel: coData.attainmentlevel
      });
    }

    const { data: mappings } = await supabase
      .from("copomappings")
      .select("courseoutcomeid, mappingstrength, programoutcomes(id, ponumber, description)")
      .in("courseoutcomeid", Array.from(coQuestionMap.keys()));

    type PoMapping = { coid: string, poid: string, ponumber: string, podescription: string, strength: number };
    
    const flatMappings: PoMapping[] = (mappings ?? []).reduce((acc: PoMapping[], m: any) => {
      const po = Array.isArray(m.programoutcomes) ? m.programoutcomes[0] : m.programoutcomes;
      if (!po) return acc;
      
      acc.push({
        coid: m.courseoutcomeid,
        poid: po.id,
        ponumber: po.ponumber,
        podescription: po.description,
        strength: Number(m.mappingstrength) ?? 0
      });
      return acc;
    }, [] as PoMapping[]);

    const poAttainments = calculatePOAttainment(coResultsForPO, flatMappings);

    const courseClassAssignmentId = assessment.courseclassassignments?.id;
    if (courseClassAssignmentId) {
      const attainmentRecords = coAttainments.map(co => ({
        courseclassassignmentid: courseClassAssignmentId,
        courseoutcomeid: co.courseoutcomeid,
        assessmenttype: assessment.assessmenttype,
        studentsattempted: co.studentsattempted,
        studentsattained: co.studentsattained,
        attainmentpercentage: co.attainmentpercentage,
        attainmentlevel: co.attainmentlevel
      }));

      await supabase
        .from("coattainmentresults")
        .delete()
        .eq("courseclassassignmentid", courseClassAssignmentId)
        .eq("assessmenttype", assessment.assessmenttype);

      await supabase
        .from("coattainmentresults")
        .insert(attainmentRecords);
    }

    return NextResponse.json({
      meta: {
        assessmenttype: assessment.assessmenttype,
        coursename: assessment.courseclassassignments?.courses?.coursename,
        branch: assessment.courseclassassignments?.branches?.name,
        classname: `${assessment.courseclassassignments?.classes?.semester}${assessment.courseclassassignments?.classes?.section}`,
        academicyear: assessment.courseclassassignments?.academicyear,
        targetpercentage: targetThreshold * 100
      },
      coattainments: coAttainments.sort((a, b) => a.conumber.localeCompare(b.conumber)),
      poattainments: poAttainments,
      studentperformance: studentPerformance.sort((a, b) => a.usn.localeCompare(b.usn))
    });

  } catch (error: any) {
    console.error("Error calculating CIE attainment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
