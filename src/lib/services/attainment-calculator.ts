/**
 * CO Attainment Calculation Service
 * 
 * Calculates Course Outcome (CO) attainment based on student marks.
 * Uses 60% threshold for individual student attainment.
 * Determines attainment levels (0-3) based on percentage of students who attained.
 */

export interface StudentMark {
    student_id: string;
    marks_obtained: number;
}

export interface QuestionAttainment {
    question_id: string;
    max_marks: number;
    students_attempted: number;
    students_attained: number;
    attainment_percentage: number;
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

/**
 * Check if a student attained based on marks and threshold
 * @param marksObtained - Marks scored by student
 * @param maxMarks - Maximum marks for the question
 * @param threshold - Threshold percentage (default 0.6 = 60%)
 * @returns true if student attained, false otherwise
 */
export function hasStudentAttained(
    marksObtained: number,
    maxMarks: number,
    threshold: number = 0.6
): boolean {
    if (maxMarks === 0) return false;
    return (marksObtained / maxMarks) >= threshold;
}

/**
 * Calculate attainment for a single question
 * @param studentMarks - Array of student marks for the question
 * @param maxMarks - Maximum marks for the question
 * @param threshold - Threshold percentage (default 0.6 = 60%)
 * @returns Question attainment details
 */
export function calculateQuestionAttainment(
    studentMarks: StudentMark[],
    maxMarks: number,
    threshold: number = 0.6
): Omit<QuestionAttainment, 'question_id'> {
    const attempted = studentMarks.length;
    const attained = studentMarks.filter(m =>
        hasStudentAttained(m.marks_obtained, maxMarks, threshold)
    ).length;

    const attainmentPercentage = attempted > 0 ? (attained / attempted) * 100 : 0;

    return {
        max_marks: maxMarks,
        students_attempted: attempted,
        students_attained: attained,
        attainment_percentage: attainmentPercentage
    };
}

/**
 * Determine attainment level from percentage
 * Level 0: < 50% students attained
 * Level 1: 50-59% students attained
 * Level 2: 60-69% students attained
 * Level 3: >= 70% students attained
 * 
 * @param percentage - Attainment percentage
 * @returns Attainment level (0-3)
 */
export function determineAttainmentLevel(percentage: number): 0 | 1 | 2 | 3 {
    if (percentage >= 70) return 3;
    if (percentage >= 60) return 2;
    if (percentage >= 50) return 1;
    return 0;
}

/**
 * Calculate CO attainment from multiple questions
 * Averages attainment percentage across all questions mapped to the CO
 * 
 * @param questionAttainments - Array of question attainment results
 * @returns CO attainment details
 */
export function calculateCOAttainment(
    questionAttainments: QuestionAttainment[]
): Omit<COAttainment, 'course_outcome_id' | 'co_number' | 'description'> {
    if (questionAttainments.length === 0) {
        return {
            students_attempted: 0,
            students_attained: 0,
            attainment_percentage: 0,
            attainment_level: 0
        };
    }

    // Average attainment percentage across all questions
    const avgPercentage = questionAttainments.reduce(
        (sum, q) => sum + q.attainment_percentage,
        0
    ) / questionAttainments.length;

    // Use max attempted count across all questions
    const totalAttempted = Math.max(
        ...questionAttainments.map(q => q.students_attempted)
    );

    // Calculate total attained based on average percentage
    const totalAttained = Math.round((avgPercentage / 100) * totalAttempted);

    return {
        students_attempted: totalAttempted,
        students_attained: totalAttained,
        attainment_percentage: avgPercentage,
        attainment_level: determineAttainmentLevel(avgPercentage)
    };
}

/**
 * Group questions by course outcome ID
 * @param questions - Array of questions with CO mappings
 * @returns Map of CO ID to question IDs
 */
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
