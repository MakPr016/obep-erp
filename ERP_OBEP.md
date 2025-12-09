# System Architecture Overview

The application needs to handle complex CO (Course Outcome) attainment calculations for exams and projects across multiple organizational levels (class, branch, department, scheme).[^2][^3][^1]

## Database Schema Design

### Core Tables

**users**

- id (UUID, PK)
- email (unique)
- password_hash
- role (enum: 'admin', 'hod', 'faculty')
- department_id (FK)
- created_at, updated_at

**departments**

- id (UUID, PK)
- name (e.g., 'Mechanical', 'CSE', 'AIML')
- code (unique)
- created_at, updated_at

**schemes**

- id (UUID, PK)
- name (e.g., '2022 Scheme', '2024 Scheme')
- year (integer)
- is_active (boolean)
- created_at, updated_at

**branches**

- id (UUID, PK)
- scheme_id (FK)
- department_id (FK)
- name (e.g., 'CSE', 'AIML', 'CSD')
- code (unique within scheme)
- created_at, updated_at

**courses**

- id (UUID, PK)
- branch_id (FK)
- course_code (e.g., '15MEP78')
- course_name
- nba_code (e.g., 'C406')
- semester (1-8)
- course_type (enum: 'theory', 'lab', 'project_phase1', 'project_phase2')
- set_target_percentage (default: 0.6)
- class_target_percentage (default: 0.5)
- created_at, updated_at

**course_outcomes (COs)**

- id (UUID, PK)
- course_id (FK)
- co_number (e.g., 'C406.1', 'C425.1')
- description (text)
- blooms_level (enum: 'CL1'-'CL6', 'PL1'-'PL5', 'AL1'-'AL5')
- created_at, updated_at

**program_outcomes (POs)**

- id (UUID, PK)
- branch_id (FK)
- po_number (e.g., 'PO1', 'PO2')
- description (text)
- type (enum: 'PO', 'PSO')
- created_at, updated_at

**co_po_mappings**

- id (UUID, PK)
- course_outcome_id (FK)
- program_outcome_id (FK)
- mapping_strength (1=Weak, 2=Moderate, 3=Strong)
- created_at, updated_at

**classes**

- id (UUID, PK)
- branch_id (FK)
- semester (1-8)
- section (e.g., 'A', 'B', 'C')
- academic_year (e.g., '2018-19')
- total_students (integer)
- created_at, updated_at

**students**

- id (UUID, PK)
- usn (unique)
- name
- class_id (FK)
- is_active (boolean)
- created_at, updated_at

### Assessment Tables

**course_class_assignments**

- id (UUID, PK)
- course_id (FK)
- class_id (FK)
- faculty_id (FK - references users)
- academic_year
- created_at, updated_at

**cie_assessments (Continuous Internal Evaluation)**

- id (UUID, PK)
- course_class_assignment_id (FK)
- assessment_type (enum: 'CIE-I', 'CIE-II', 'CIE-III')
- total_marks (default: 30)
- created_at, updated_at

**cie_questions**

- id (UUID, PK)
- cie_assessment_id (FK)
- question_number
- course_outcome_id (FK)
- max_marks
- blooms_level
- created_at, updated_at

**cie_student_marks**

- id (UUID, PK)
- cie_question_id (FK)
- student_id (FK)
- marks_obtained (decimal)
- created_at, updated_at

**see_assessments (Semester End Exam)**

- id (UUID, PK)
- course_class_assignment_id (FK)
- total_marks (default: 100)
- created_at, updated_at

**see_questions**

- id (UUID, PK)
- see_assessment_id (FK)
- question_number
- course_outcome_id (FK)
- max_marks
- blooms_level
- created_at, updated_at

**see_student_marks**

- id (UUID, PK)
- see_question_id (FK)
- student_id (FK)
- marks_obtained (decimal)
- created_at, updated_at

**project_assessments**

- id (UUID, PK)
- course_class_assignment_id (FK)
- project_type (enum: 'phase1', 'phase2')
- total_marks (default: 100)
- created_at, updated_at

**project_criteria**

- id (UUID, PK)
- project_assessment_id (FK)
- criteria_code (e.g., 'AC1', 'AC2')
- criteria_name (e.g., 'Content of Presentation')
- max_marks
- created_at, updated_at

**project_criteria_co_mapping**

- id (UUID, PK)
- project_criteria_id (FK)
- course_outcome_id (FK)
- marks_allocation
- created_at, updated_at

**project_student_marks**

- id (UUID, PK)
- project_criteria_id (FK)
- student_id (FK)
- marks_obtained (decimal)
- created_at, updated_at

### Computed Results Tables

**co_attainment_results**

- id (UUID, PK)
- course_class_assignment_id (FK)
- course_outcome_id (FK)
- assessment_type (enum: 'CIE', 'SEE', 'PROJECT', 'COMBINED')
- students_attempted (integer)
- students_attained (integer)
- attainment_percentage (decimal)
- attainment_level (0-3)
- created_at, updated_at

**po_attainment_results**

- id (UUID, PK)
- course_class_assignment_id (FK)
- program_outcome_id (FK)
- attainment_value (decimal)
- attainment_level (0-3)
- created_at, updated_at

## Routes Structure

### Authentication Routes

- `POST /api/auth/login` - HOD/Faculty login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Department \& Scheme Routes

- `GET /api/schemes` - List all schemes
- `GET /api/schemes/:schemeId/branches` - Get branches for scheme
- `GET /api/branches/:branchId/courses` - Get courses (1st-8th sem)
- `GET /api/branches/:branchId/classes` - Get all class sections

### Course Management Routes

- `GET /api/courses/:courseId` - Get course details
- `PUT /api/courses/:courseId` - Update course metadata
- `GET /api/courses/:courseId/outcomes` - Get all COs
- `POST /api/courses/:courseId/outcomes` - Add new CO
- `PUT /api/course-outcomes/:coId` - Update CO
- `DELETE /api/course-outcomes/:coId` - Delete CO
- `GET /api/course-outcomes/:coId/po-mappings` - Get CO-PO mappings
- `PUT /api/course-outcomes/:coId/po-mappings` - Update CO-PO mappings

### Class \& Student Routes

- `GET /api/classes/:classId` - Get class details
- `GET /api/classes/:classId/students` - Get student list
- `POST /api/classes/:classId/students` - Add students (bulk)
- `PUT /api/students/:studentId` - Update student
- `DELETE /api/students/:studentId` - Remove student

### Assessment Routes

**CIE Routes**

- `GET /api/course-classes/:courseClassId/cie/:type` - Get CIE assessment (CIE-I, II, III)
- `POST /api/course-classes/:courseClassId/cie/:type` - Create CIE assessment
- `PUT /api/cie/:cieId/questions` - Update question-CO mapping
- `POST /api/cie/:cieId/marks` - Bulk upload student marks
- `GET /api/cie/:cieId/attainment` - Calculate CIE attainment

**SEE Routes**

- `GET /api/course-classes/:courseClassId/see` - Get SEE assessment
- `POST /api/course-classes/:courseClassId/see` - Create SEE assessment
- `PUT /api/see/:seeId/questions` - Update question-CO mapping
- `POST /api/see/:seeId/marks` - Bulk upload student marks
- `GET /api/see/:seeId/attainment` - Calculate SEE attainment

**Project Routes**

- `GET /api/course-classes/:courseClassId/project/:phase` - Get project assessment
- `POST /api/course-classes/:courseClassId/project/:phase` - Create project assessment
- `PUT /api/project/:projectId/criteria` - Update criteria-CO mapping
- `POST /api/project/:projectId/marks` - Bulk upload student marks
- `GET /api/project/:projectId/attainment` - Calculate project attainment

### Attainment Calculation Routes

- `GET /api/course-classes/:courseClassId/co-attainment` - Overall CO attainment
- `GET /api/course-classes/:courseClassId/po-attainment` - Overall PO attainment
- `GET /api/students/:studentId/attainment` - Individual student attainment
- `GET /api/branches/:branchId/attainment` - Branch-level attainment
- `GET /api/departments/:deptId/attainment` - Department-level attainment

### Export Routes

- `GET /api/course-classes/:courseClassId/export/excel` - Export to Excel format
- `GET /api/course-classes/:courseClassId/export/pdf` - Export to PDF report

## Attainment Calculation Logic

### CO Attainment Formulas (from files)

**Level Determination**:[^4]

- Level 0: < 50% students scoring ≥ 50%
- Level 1: 50-59% students scoring ≥ 50%
- Level 2: 60-69% students scoring ≥ 50%
- Level 3: ≥ 70% students scoring ≥ 50%

**For Regular Exams (CIE/SEE)**:[^2]

1. For each question mapped to a CO:
    - Count students who scored ≥ 60% of max marks for that question
    - Calculate: (Students attained / Students attempted) × 100
2. Average across all questions for that CO
3. Determine attainment level based on thresholds

**For Projects**:[^3][^1]

1. Each Assessment Criterion (AC) is mapped to one or more COs with specific marks allocation
2. For each CO:
    - Sum marks from all criteria mapped to that CO
    - Calculate student's percentage: (Marks obtained / Total marks for CO) × 100
    - Student attains if percentage ≥ 50%
3. CO Attainment = (Students attained / Total students) × 100
4. Determine level

**PO Attainment Calculation**:[^1]

1. For each PO mapped to COs:
    - Multiply CO attainment percentage by mapping strength (1, 2, or 3)
    - Sum all weighted attainments for that PO
    - Divide by sum of all mapping strengths
2. Result is PO attainment level (1-3)

### Different Calculation Contexts

**Particular Student**:

- Calculate individual CO attainment for each assessment
- Show whether student achieved each CO (≥50% threshold)
- Aggregate across all assessments

**Particular Class**:

- Calculate class-level CO attainment for the course
- Combine CIE (average of I, II, III) + SEE or Project marks
- Generate PO attainment from CO results

**Particular Branch**:

- Aggregate CO/PO attainment across all classes in semester
- Average attainment levels across sections (A, B, C, etc.)

**Particular Faculty**:

- Show all courses taught by faculty
- CO/PO attainment for each course-class combination
- Comparative analysis across semesters

## Frontend Page Structure

### Authentication

- `/login` - Login page (HOD credentials)

### Dashboard

- `/dashboard` - After login, shows department overview
  - Scheme selector dropdown
  - Branch selector dropdown (filtered by scheme)
  - Two main cards: "Manage Courses" and "Manage Classes"

### Course Management

- `/schemes/:schemeId/branches/:branchId/courses` - Course listing (1st-8th sem)
- `/courses/:courseId/edit` - Edit course details
- `/courses/:courseId/outcomes` - Manage COs
  - Add/Edit/Delete CO
  - CO-PO mapping matrix interface
  - Bloom's taxonomy level assignment

### Class Management

- `/schemes/:schemeId/branches/:branchId/classes` - Class listing
- `/classes/:classId` - Class details
- `/classes/:classId/students` - Student list management
  - Bulk import via Excel
  - Add/Edit individual students

### Assessment Management

- `/course-classes/:courseClassId` - Assessment hub
  - Tabs: CIE-I, CIE-II, CIE-III, SEE, Project Phase 1/2

**CIE Tab** - `/course-classes/:courseClassId/cie/:type`

- Question paper structure (questions mapped to COs)
- Marks entry grid (students × questions)
- Excel import functionality
- Real-time attainment calculation display

**SEE Tab** - `/course-classes/:courseClassId/see`

- Similar to CIE with 100-mark structure

**Project Tab** - `/course-classes/:courseClassId/project/:phase`

- Criteria definition (AC1-AC7)
- Criteria-to-CO mapping with marks allocation
- Presentation + Guide marks entry
- Student-wise marks grid

### Reports \& Analytics

- `/course-classes/:courseClassId/attainment` - Detailed attainment report
  - CO-wise attainment table
  - PO-wise attainment table
  - Student-wise performance
  - Graphical representations
- `/students/:studentId/report` - Individual student report
  - All COs achieved/not achieved
  - Assessment-wise breakdown
- `/branches/:branchId/analytics` - Branch analytics
  - Semester-wise attainment trends
  - Course comparison
- `/faculty/:facultyId/dashboard` - Faculty-specific dashboard
  - All assigned courses
  - Comparative attainment metrics

## API Response Structures

**CO Attainment Response**:

```json
{
  "courseOutcomeId": "uuid",
  "coNumber": "C406.1",
  "assessmentType": "CIE-I",
  "studentsAttempted": 80,
  "studentsAttained": 65,
  "attainmentPercentage": 81.25,
  "attainmentLevel": 3,
  "bloomsLevel": "CL2",
  "status": "PASS"
}
```

**PO Attainment Response**:

```json
{
  "programOutcomeId": "uuid",
  "poNumber": "PO1",
  "attainmentValue": 2.5,
  "attainmentLevel": "LEVEL 3",
  "contributingCOs": [
    {
      "coNumber": "C406.1",
      "mappingStrength": 3,
      "coAttainment": 81.25
    }
  ]
}
```

## State Management (Frontend)

**Global State (Context/Zustand)**:

- `authStore`: user session, department info
- `schemeStore`: selected scheme, branch
- `courseStore`: current course, COs, PO mappings
- `assessmentStore`: current assessment data, marks

**Local State**:

- Form inputs for marks entry
- UI states (loading, modals, toasts)

## Key UI Components (shadcn)

- `<DataTable>` - Student marks grid with inline editing
- `<MatrixEditor>` - CO-PO mapping matrix
- `<AttainmentCard>` - Display CO/PO attainment levels with color coding
- `<BulkImportDialog>` - Excel file upload with validation
- `<StudentSelector>` - Filterable student list
- `<CourseOutcomeForm>` - Add/Edit CO with Bloom's level
- `<AttainmentChart>` - Visualization (bar/line charts)
- `<ExportButton>` - Download Excel/PDF reports

## Special Considerations

### Marks Entry Workflow

1. Faculty creates assessment structure (questions/criteria mapped to COs)
2. System generates marks entry template
3. Faculty uploads Excel or enters manually
4. System validates marks (max marks, data types)
5. Real-time calculation of attainment upon save
6. Lock feature to prevent accidental edits after finalization

### Calculation Triggers

- Automatic recalculation when marks are updated
- Background job for branch/department aggregations
- Cache attainment results with invalidation on data change

### Excel Import/Export

- Template generation matching the structure in files
- Support for both CIE format (multiple questions) and Project format (criteria-based)
- Validation rules embedded in templates

### Permissions

- HODs: Full access to their department
- Faculty: Access only to assigned courses
- Admin: System-wide access
