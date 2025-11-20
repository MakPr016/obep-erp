export interface StudentMark {
    student_id: string;
    marks_obtained: number;
    cie_question_id: string;
}

export interface COAttainment {
    course_outcome_id: string;
    co_number: string;
    description?: string;
    students_attempted: number;
    students_attained: number;
    attainment_percentage: number;
    attainment_level: 0 | 1 | 2 | 3;
}

export interface POContribution {
    program_outcome_id: string;
    po_number: string;
    co_number: string;
    mapping_strength: number;
    co_attainment_value: number;
    weighted_contribution: number;
}

export interface POAttainmentResult {
    program_outcome_id: string;
    po_number: string;
    description: string;
    calculated_attainment: number;
    contributing_cos: POContribution[];
}

export function hasStudentAttained(
    marksObtained: number,
    maxMarks: number,
    threshold: number = 0.6
): boolean {
    if (maxMarks === 0) return false;
    return (marksObtained / maxMarks) >= threshold;
}

// Correctly handles student-wise aggregation
export function calculateCoAttainmentStudentWise(
    studentData: { 
        student_id: string; 
        total_marks_obtained: number; 
        total_max_marks: number; 
    }[],
    threshold: number = 0.6
): { students_attempted: number; students_attained: number; percentage: number; level: 0|1|2|3 } {
    let attempted = 0;
    let attained = 0;

    for (const student of studentData) {
        if (student.total_max_marks > 0) {
            attempted++;
            // Avoid division by zero
            const percentage = student.total_marks_obtained / student.total_max_marks;
            if (percentage >= threshold) {
                attained++;
            }
        }
    }

    // Final percentage of students who attained the CO
    const percentage = attempted > 0 ? (attained / attempted) * 100 : 0;
    
    return {
        students_attempted: attempted,
        students_attained: attained,
        percentage: percentage,
        level: determineAttainmentLevel(percentage)
    };
}

export function determineAttainmentLevel(percentage: number): 0 | 1 | 2 | 3 {
    if (percentage >= 70) return 3;
    if (percentage >= 60) return 2;
    if (percentage >= 50) return 1;
    return 0;
}

export function groupQuestionsByCO(
    questions: Array<{ id: string; course_outcome_id: string }>
): Map<string, string[]> {
    const grouped = new Map<string, string[]>();
    questions.forEach(q => {
        if (!q.course_outcome_id) return;

        if (!grouped.has(q.course_outcome_id)) {
            grouped.set(q.course_outcome_id, []);
        }
        grouped.get(q.course_outcome_id)!.push(q.id);
    });
    return grouped;
}

export function calculatePOAttainment(
    coResults: { co_id: string; co_number: string; attainment_level: number }[],
    mappings: { co_id: string; po_id: string; po_number: string; po_description: string; strength: number }[]
): POAttainmentResult[] {
    const poMap = new Map<string, {
        po_number: string;
        description: string;
        contributions: POContribution[];
        totalStrength: number;
        weightedSum: number;
    }>();

    mappings.forEach(mapping => {
        const coResult = coResults.find(co => co.co_id === mapping.co_id);

        if (coResult) {
            if (!poMap.has(mapping.po_id)) {
                poMap.set(mapping.po_id, {
                    po_number: mapping.po_number,
                    description: mapping.po_description,
                    contributions: [],
                    totalStrength: 0,
                    weightedSum: 0
                });
            }

            const poData = poMap.get(mapping.po_id)!;
            const contribution = coResult.attainment_level * mapping.strength;

            poData.contributions.push({
                program_outcome_id: mapping.po_id,
                po_number: mapping.po_number,
                co_number: coResult.co_number,
                mapping_strength: mapping.strength,
                co_attainment_value: coResult.attainment_level,
                weighted_contribution: contribution
            });

            poData.totalStrength += mapping.strength;
            poData.weightedSum += contribution;
        }
    });

    return Array.from(poMap.entries()).map(([poId, data]) => ({
        program_outcome_id: poId,
        po_number: data.po_number,
        description: data.description,
        calculated_attainment: data.totalStrength > 0
            ? Number((data.weightedSum / data.totalStrength).toFixed(2))
            : 0,
        contributing_cos: data.contributions
    })).sort((a, b) => a.po_number.localeCompare(b.po_number));
}