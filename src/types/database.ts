export type UserRole = 'admin' | 'hod' | 'faculty'
export type CourseType = 'theory' | 'lab' | 'project_phase1' | 'project_phase2'
export type BloomsLevel = 'CL1' | 'CL2' | 'CL3' | 'CL4' | 'CL5' | 'CL6' | 
                           'PL1' | 'PL2' | 'PL3' | 'PL4' | 'PL5' | 
                           'AL1' | 'AL2' | 'AL3' | 'AL4' | 'AL5'
export type AssessmentType = 'CIE-I' | 'CIE-II' | 'CIE-III' | 'SEE' | 'PROJECT' | 'COMBINED'
export type AttainmentLevel = 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'
export type POType = 'PO' | 'PSO'

export interface Department {
  id: string
  name: string
  code: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: UserRole
  department_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Scheme {
  id: string
  name: string
  year: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  scheme_id: string | null
  department_id: string | null
  name: string
  code: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  branch_id: string | null
  course_code: string
  course_name: string
  nba_code: string | null
  semester: number
  course_type: CourseType
  set_target_percentage: number
  class_target_percentage: number
  created_at: string
  updated_at: string
}

export interface CourseOutcome {
  id: string
  course_id: string | null
  co_number: string
  description: string
  blooms_level: BloomsLevel
  created_at: string
  updated_at: string
}

export interface ProgramOutcome {
  id: string
  branch_id: string | null
  po_number: string
  description: string
  type: POType
  created_at: string
  updated_at: string
}

export interface COPOMapping {
  id: string
  course_outcome_id: string | null
  program_outcome_id: string | null
  mapping_strength: 1 | 2 | 3
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  branch_id: string | null
  semester: number
  section: string
  academic_year: string
  total_students: number
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  usn: string
  name: string
  class_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CourseClassAssignment {
  id: string
  course_id: string | null
  class_id: string | null
  faculty_id: string | null
  academic_year: string
  created_at: string
  updated_at: string
}

export interface CIEAssessment {
  id: string
  course_class_assignment_id: string | null
  assessment_type: AssessmentType
  total_marks: number
  created_at: string
  updated_at: string
}

export interface CIEQuestion {
  id: string
  cie_assessment_id: string | null
  question_number: number
  course_outcome_id: string | null
  max_marks: number
  blooms_level: BloomsLevel | null
  created_at: string
  updated_at: string
}

export interface CIEStudentMark {
  id: string
  cie_question_id: string | null
  student_id: string | null
  marks_obtained: number | null
  created_at: string
  updated_at: string
}

export interface SEEAssessment {
  id: string
  course_class_assignment_id: string | null
  total_marks: number
  created_at: string
  updated_at: string
}

export interface SEEQuestion {
  id: string
  see_assessment_id: string | null
  question_number: number
  course_outcome_id: string | null
  max_marks: number
  blooms_level: BloomsLevel | null
  created_at: string
  updated_at: string
}

export interface SEEStudentMark {
  id: string
  see_question_id: string | null
  student_id: string | null
  marks_obtained: number | null
  created_at: string
  updated_at: string
}

export interface ProjectAssessment {
  id: string
  course_class_assignment_id: string | null
  project_type: 'phase1' | 'phase2'
  total_marks: number
  created_at: string
  updated_at: string
}

export interface ProjectCriteria {
  id: string
  project_assessment_id: string | null
  criteria_code: string
  criteria_name: string
  max_marks: number
  created_at: string
  updated_at: string
}

export interface ProjectCriteriaCOMapping {
  id: string
  project_criteria_id: string | null
  course_outcome_id: string | null
  marks_allocation: number
  created_at: string
  updated_at: string
}

export interface ProjectStudentMark {
  id: string
  project_criteria_id: string | null
  student_id: string | null
  marks_obtained: number | null
  created_at: string
  updated_at: string
}

export interface COAttainmentResult {
  id: string
  course_class_assignment_id: string | null
  course_outcome_id: string | null
  assessment_type: AssessmentType
  students_attempted: number | null
  students_attained: number | null
  attainment_percentage: number | null
  attainment_level: number | null
  created_at: string
  updated_at: string
}

export interface POAttainmentResult {
  id: string
  course_class_assignment_id: string | null
  program_outcome_id: string | null
  attainment_value: number | null
  attainment_level: AttainmentLevel | null
  created_at: string
  updated_at: string
}

export interface CourseWithBranch extends Course {
  branch: Branch
}

export interface CourseWithDetails extends Course {
  branch: Branch & {
    department: Department
    scheme: Scheme | null
  }
}

export interface StudentWithClass extends Student {
  class: Class
}

export interface CourseOutcomeWithCourse extends CourseOutcome {
  course: Course
}

export interface CIEAssessmentWithDetails extends CIEAssessment {
  course_class_assignment: CourseClassAssignment
  cie_questions: CIEQuestion[]
}

export type DepartmentInput = Omit<Department, 'id' | 'created_at' | 'updated_at'>
export type UserInput = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type CourseInput = Omit<Course, 'id' | 'created_at' | 'updated_at'>
export type StudentInput = Omit<Student, 'id' | 'created_at' | 'updated_at'>

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

