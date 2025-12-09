export interface COAttainment {
  courseoutcomeid: string;
  conumber: string;
  description: string;
  studentsattempted: number;
  studentsattained: number;
  attainmentpercentage: number;
  attainmentlevel: 0 | 1 | 2 | 3;
}

export interface POAttainmentResult {
  programoutcomeid: string;
  ponumber: string;
  description: string;
  calculatedattainment: number;
  contributingcos: {
    programoutcomeid: string;
    ponumber: string;
    conumber: string;
    mappingstrength: number;
    coattainmentvalue: number;
    weightedcontribution: number;
  }[];
}

export function determineAttainmentLevel(percentage: number): 0 | 1 | 2 | 3 {
  if (percentage >= 70) return 3;
  if (percentage >= 65) return 2;
  if (percentage >= 60) return 1;
  return 0;
}

export function calculateCoAttainmentStudentWise(
  studentData: { studentid: string; totalmarksobtained: number; totalmaxmarks: number }[],
  threshold: number = 0.5
): {
  studentsattempted: number;
  studentsattained: number;
  percentage: number;
  level: 0 | 1 | 2 | 3;
} {
  let attempted = 0;
  let attained = 0;

  for (const student of studentData) {
    if (student.totalmaxmarks > 0) {
      attempted++;
      const percentage = student.totalmarksobtained / student.totalmaxmarks;
      if (percentage >= threshold) {
        attained++;
      }
    }
  }

  const percentage = attempted > 0 ? (attained / attempted) * 100 : 0;

  return {
    studentsattempted: attempted,
    studentsattained: attained,
    percentage: percentage,
    level: determineAttainmentLevel(percentage),
  };
}

export function calculatePOAttainment(
  coResults: { coid: string; conumber: string; attainmentlevel: number }[],
  mappings: { coid: string; poid: string; ponumber: string; podescription: string; strength: number }[]
): POAttainmentResult[] {
  const poMap = new Map<string, {
    ponumber: string;
    description: string;
    contributions: POAttainmentResult['contributingcos'];
    totalStrength: number;
    weightedSum: number;
  }>();

  mappings.forEach(mapping => {
    const coResult = coResults.find(co => co.coid === mapping.coid);
    if (coResult) {
      if (!poMap.has(mapping.poid)) {
        poMap.set(mapping.poid, {
          ponumber: mapping.ponumber,
          description: mapping.podescription,
          contributions: [],
          totalStrength: 0,
          weightedSum: 0
        });
      }

      const poData = poMap.get(mapping.poid)!;
      const contribution = coResult.attainmentlevel * mapping.strength;

      poData.contributions.push({
        programoutcomeid: mapping.poid,
        ponumber: mapping.ponumber,
        conumber: coResult.conumber,
        mappingstrength: mapping.strength,
        coattainmentvalue: coResult.attainmentlevel,
        weightedcontribution: contribution
      });

      poData.totalStrength += mapping.strength;
      poData.weightedSum += contribution;
    }
  });

  return Array.from(poMap.entries()).map(([poId, data]) => ({
    programoutcomeid: poId,
    ponumber: data.ponumber,
    description: data.description,
    calculatedattainment: data.totalStrength > 0 
      ? Number((data.weightedSum / data.totalStrength).toFixed(2)) 
      : 0,
    contributingcos: data.contributions
      .sort((a, b) => a.ponumber.localeCompare(b.ponumber))
  })).sort((a, b) => a.ponumber.localeCompare(b.ponumber));
}

export function groupQuestionsByCO(questions: Array<{ id: string, courseoutcomeid: string }>): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  questions.forEach(q => {
    if (!q.courseoutcomeid) return;
    if (!grouped.has(q.courseoutcomeid)) {
      grouped.set(q.courseoutcomeid, []);
    }
    grouped.get(q.courseoutcomeid)!.push(q.id);
  });
  return grouped;
}
