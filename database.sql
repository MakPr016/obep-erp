-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.account (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  accountId text NOT NULL,
  providerId text NOT NULL,
  userId text NOT NULL,
  accessToken text,
  refreshToken text,
  expiresAt timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT account_pkey PRIMARY KEY (id),
  CONSTRAINT account_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);
CREATE TABLE public.assignment_student_marks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  assignment_id uuid NOT NULL,
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  marks_obtained numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assignment_student_marks_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_student_marks_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT assignment_student_marks_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT assignment_student_marks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  total_marks integer NOT NULL DEFAULT 100,
  status character varying NOT NULL DEFAULT 'DRAFT'::character varying,
  due_date date,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  blooms_level text,
  daves_level text,
  class_id uuid,
  CONSTRAINT assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.branches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  scheme_id uuid,
  department_id uuid,
  name character varying NOT NULL,
  code character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT branches_pkey PRIMARY KEY (id),
  CONSTRAINT branches_scheme_id_fkey FOREIGN KEY (scheme_id) REFERENCES public.schemes(id),
  CONSTRAINT branches_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.cie_assessments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_class_assignment_id uuid,
  assessment_type USER-DEFINED NOT NULL,
  total_marks integer DEFAULT 30,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  assessment_name character varying,
  CONSTRAINT cie_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT cie_assessments_course_class_assignment_id_fkey FOREIGN KEY (course_class_assignment_id) REFERENCES public.course_class_assignments(id)
);
CREATE TABLE public.cie_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cie_assessment_id uuid,
  question_number integer NOT NULL,
  course_outcome_id uuid,
  max_marks numeric NOT NULL,
  blooms_level USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sub_question_label character varying,
  is_part_a boolean DEFAULT true,
  part_number integer,
  CONSTRAINT cie_questions_pkey PRIMARY KEY (id),
  CONSTRAINT cie_questions_cie_assessment_id_fkey FOREIGN KEY (cie_assessment_id) REFERENCES public.cie_assessments(id),
  CONSTRAINT cie_questions_course_outcome_id_fkey FOREIGN KEY (course_outcome_id) REFERENCES public.course_outcomes(id)
);
CREATE TABLE public.cie_student_marks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cie_question_id uuid,
  student_id uuid,
  marks_obtained numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cie_student_marks_pkey PRIMARY KEY (id),
  CONSTRAINT cie_student_marks_cie_question_id_fkey FOREIGN KEY (cie_question_id) REFERENCES public.cie_questions(id),
  CONSTRAINT cie_student_marks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  branch_id uuid,
  semester integer CHECK (semester >= 1 AND semester <= 8),
  section character varying NOT NULL,
  academic_year character varying NOT NULL,
  total_students integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.co_attainment_results (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_class_assignment_id uuid,
  course_outcome_id uuid,
  assessment_type USER-DEFINED NOT NULL,
  students_attempted integer,
  students_attained integer,
  attainment_percentage numeric,
  attainment_level numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT co_attainment_results_pkey PRIMARY KEY (id),
  CONSTRAINT co_attainment_results_course_class_assignment_id_fkey FOREIGN KEY (course_class_assignment_id) REFERENCES public.course_class_assignments(id),
  CONSTRAINT co_attainment_results_course_outcome_id_fkey FOREIGN KEY (course_outcome_id) REFERENCES public.course_outcomes(id)
);
CREATE TABLE public.co_po_mappings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_outcome_id uuid,
  program_outcome_id uuid,
  mapping_strength integer CHECK (mapping_strength >= 1 AND mapping_strength <= 3),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT co_po_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT co_po_mappings_course_outcome_id_fkey FOREIGN KEY (course_outcome_id) REFERENCES public.course_outcomes(id),
  CONSTRAINT co_po_mappings_program_outcome_id_fkey FOREIGN KEY (program_outcome_id) REFERENCES public.program_outcomes(id)
);
CREATE TABLE public.course_class_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid,
  class_id uuid,
  faculty_id uuid,
  academic_year character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_class_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT course_class_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_class_assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT course_class_assignments_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.users(id)
);
CREATE TABLE public.course_outcomes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid,
  co_number character varying NOT NULL,
  description text NOT NULL,
  blooms_level USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_outcomes_pkey PRIMARY KEY (id),
  CONSTRAINT course_outcomes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  branch_id uuid,
  course_code character varying NOT NULL,
  course_name character varying NOT NULL,
  nba_code character varying,
  semester integer CHECK (semester >= 1 AND semester <= 8),
  course_type USER-DEFINED NOT NULL,
  set_target_percentage numeric DEFAULT 0.60,
  class_target_percentage numeric DEFAULT 0.50,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  code character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.po_attainment_results (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_class_assignment_id uuid,
  program_outcome_id uuid,
  attainment_value numeric,
  attainment_level USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT po_attainment_results_pkey PRIMARY KEY (id),
  CONSTRAINT po_attainment_results_course_class_assignment_id_fkey FOREIGN KEY (course_class_assignment_id) REFERENCES public.course_class_assignments(id),
  CONSTRAINT po_attainment_results_program_outcome_id_fkey FOREIGN KEY (program_outcome_id) REFERENCES public.program_outcomes(id)
);
CREATE TABLE public.program_outcomes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  branch_id uuid,
  po_number character varying NOT NULL,
  description text NOT NULL,
  type character varying CHECK (type::text = ANY (ARRAY['PO'::character varying, 'PSO'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT program_outcomes_pkey PRIMARY KEY (id),
  CONSTRAINT program_outcomes_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.project_assessments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_class_assignment_id uuid,
  project_type character varying CHECK (project_type::text = ANY (ARRAY['phase1'::character varying, 'phase2'::character varying]::text[])),
  total_marks integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT project_assessments_course_class_assignment_id_fkey FOREIGN KEY (course_class_assignment_id) REFERENCES public.course_class_assignments(id)
);
CREATE TABLE public.project_criteria (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_assessment_id uuid,
  criteria_code character varying NOT NULL,
  criteria_name character varying NOT NULL,
  max_marks numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_criteria_pkey PRIMARY KEY (id),
  CONSTRAINT project_criteria_project_assessment_id_fkey FOREIGN KEY (project_assessment_id) REFERENCES public.project_assessments(id)
);
CREATE TABLE public.project_criteria_co_mapping (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_criteria_id uuid,
  course_outcome_id uuid,
  marks_allocation numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_criteria_co_mapping_pkey PRIMARY KEY (id),
  CONSTRAINT project_criteria_co_mapping_project_criteria_id_fkey FOREIGN KEY (project_criteria_id) REFERENCES public.project_criteria(id),
  CONSTRAINT project_criteria_co_mapping_course_outcome_id_fkey FOREIGN KEY (course_outcome_id) REFERENCES public.course_outcomes(id)
);
CREATE TABLE public.project_student_marks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_criteria_id uuid,
  student_id uuid,
  marks_obtained numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_student_marks_pkey PRIMARY KEY (id),
  CONSTRAINT project_student_marks_project_criteria_id_fkey FOREIGN KEY (project_criteria_id) REFERENCES public.project_criteria(id),
  CONSTRAINT project_student_marks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.schemes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  year integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schemes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.see_assessments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_class_assignment_id uuid,
  total_marks integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  assessment_name character varying,
  CONSTRAINT see_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT see_assessments_course_class_assignment_id_fkey FOREIGN KEY (course_class_assignment_id) REFERENCES public.course_class_assignments(id)
);
CREATE TABLE public.see_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  see_assessment_id uuid,
  question_number integer NOT NULL,
  course_outcome_id uuid,
  max_marks numeric NOT NULL,
  blooms_level USER-DEFINED,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sub_question_label character varying,
  is_part_a boolean DEFAULT true,
  part_number integer,
  CONSTRAINT see_questions_pkey PRIMARY KEY (id),
  CONSTRAINT see_questions_see_assessment_id_fkey FOREIGN KEY (see_assessment_id) REFERENCES public.see_assessments(id),
  CONSTRAINT see_questions_course_outcome_id_fkey FOREIGN KEY (course_outcome_id) REFERENCES public.course_outcomes(id)
);
CREATE TABLE public.see_student_marks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  see_question_id uuid,
  student_id uuid,
  marks_obtained numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT see_student_marks_pkey PRIMARY KEY (id),
  CONSTRAINT see_student_marks_see_question_id_fkey FOREIGN KEY (see_question_id) REFERENCES public.see_questions(id),
  CONSTRAINT see_student_marks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.session (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  expiresAt timestamp without time zone NOT NULL,
  ipAddress text,
  userAgent text,
  userId text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT session_pkey PRIMARY KEY (id),
  CONSTRAINT session_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  usn character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  class_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.user (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  email text NOT NULL UNIQUE,
  emailVerified boolean NOT NULL DEFAULT false,
  name text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  image text,
  password text,
  role text,
  fullName text,
  departmentId text,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name character varying NOT NULL,
  role USER-DEFINED NOT NULL,
  department_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.verification (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  identifier text NOT NULL,
  value text NOT NULL,
  expiresAt timestamp without time zone NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT verification_pkey PRIMARY KEY (id)
);