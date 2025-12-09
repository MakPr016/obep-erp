# OBEP ERP - Outcome-Based Education Platform

A comprehensive Enterprise Resource Planning (ERP) system designed for educational institutions implementing Outcome-Based Education (OBE) principles. Built with Next.js 16, TypeScript, and Supabase.

## 🎯 Overview

OBEP ERP is a modern web application that streamlines academic administration, assessment management, and outcome tracking for educational institutions. The platform supports role-based access control for administrators, HODs, and faculty members.

## ✨ Key Features

### 👥 User Management
- **Role-Based Access Control**: Admin, HOD, and Faculty roles with specific permissions
- **Department-Based Organization**: Users organized by departments
- **Secure Authentication**: Built with NextAuth.js and Supabase

### 🏢 Academic Structure Management
- **Departments**: Manage academic departments
- **Schemes**: Define curriculum schemes with academic years
- **Branches**: Configure branches linked to departments and schemes
- **Classes**: Create and manage classes with semester, section, and academic year
- **Courses**: Comprehensive course management with NBA codes and outcome tracking

### 👨‍🎓 Student Management
- **Student Records**: Complete student information with USN, email, and contact details
- **Class Assignment**: Link students to specific classes
- **Bulk Operations**: Import students via CSV and bulk activate/deactivate
- **Status Tracking**: Active/inactive student status management

### 📝 Assessment Management

#### CIE (Continuous Internal Evaluation) Assessments
- **Assessment Types**: CIE-I, CIE-II, CIE-III
- **Question Paper Builder**: Create structured question papers with parts and sub-questions
- **Course Outcome Mapping**: Link questions to specific course outcomes
- **Bloom's Taxonomy Levels**: Support for CL1-CL6 cognitive levels
- **Detailed View**: Comprehensive assessment details with question structure

#### SEE (Semester End Examination) Assessments
- Similar structure to CIE with semester-end specific configurations

### 🎯 Outcome Management
- **Course Outcomes (CO)**: Define and track course-level outcomes
- **Program Outcomes (PO)**: Manage program-level outcomes
- **CO-PO Mapping**: Map course outcomes to program outcomes with strength levels (1-3)
- **Attainment Tracking**: Calculate and monitor outcome attainment

### 📊 Course-Class Assignments
- Assign faculty to specific courses and classes
- Track academic year and assignment details
- Support for multiple assignments per course

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **API**: Next.js API Routes
- **Runtime**: Node.js

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript

## 📁 Project Structure

```
obep-erp/
├── src/
│   ├── app/
│   │   ├── (main)/              # Protected routes
│   │   │   ├── assessments/     # Assessment pages
│   │   │   ├── branches/        # Branch management
│   │   │   ├── classes/         # Class management
│   │   │   ├── courses/         # Course management
│   │   │   ├── students/        # Student management
│   │   │   └── users/           # User management
│   │   ├── api/                 # API routes
│   │   │   ├── assessments/     # Assessment APIs
│   │   │   ├── branches/        # Branch APIs
│   │   │   ├── classes/         # Class APIs
│   │   │   ├── courses/         # Course APIs
│   │   │   ├── students/        # Student APIs
│   │   │   └── users/           # User APIs
│   │   └── auth/                # Authentication pages
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── assessments/         # Assessment-specific components
│   ├── lib/
│   │   └── supabase/            # Supabase client configuration
│   └── auth.ts                  # NextAuth configuration
├── database.sql                 # Database schema
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd obep-erp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run the SQL schema from `database.sql` in your Supabase SQL editor.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Tables
- `users` - User accounts with role-based access
- `departments` - Academic departments
- `schemes` - Curriculum schemes
- `branches` - Academic branches
- `classes` - Class sections
- `courses` - Course catalog
- `students` - Student records
- `course_class_assignments` - Faculty-course-class mappings

### Assessment Tables
- `cie_assessments` - CIE assessment records
- `cie_questions` - CIE question details
- `see_assessments` - SEE assessment records
- `see_questions` - SEE question details

### Outcome Tables
- `course_outcomes` - Course-level outcomes
- `program_outcomes` - Program-level outcomes
- `co_po_mappings` - CO-PO relationship mappings
- `co_attainment_results` - Outcome attainment tracking

## 🔐 User Roles & Permissions

### Admin
- Full system access
- Manage all users, departments, and configurations
- View all data across departments

### HOD (Head of Department)
- Department-specific access
- Manage courses, classes, and students within department
- View department-specific assessments and outcomes

### Faculty
- Access to assigned courses only
- Create and manage assessments for assigned courses
- View student records in assigned classes

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-friendly interface
- **Dark Mode Support**: (if implemented)
- **Loading States**: Smooth loading indicators with spinners
- **Toast Notifications**: User-friendly success/error messages
- **Dependent Filtering**: Cascading filters (Scheme → Branch → Semester)
- **Bulk Operations**: Efficient bulk student management
- **Modal Dialogs**: Clean modal interfaces for forms

## 📝 Key Workflows

### Creating an Assessment
1. Navigate to Assessments page
2. Select Scheme → Branch → Semester to filter courses
3. Choose a course and click "Add CIE Assessment" or "Add SEE Assessment"
4. Select the specific class/section and faculty assignment
5. Choose assessment type (CIE-I, CIE-II, or CIE-III)
6. Build question paper structure with parts and sub-questions
7. Map each question to course outcomes and Bloom's levels
8. Submit to create the assessment

### Managing Students
1. Navigate to Students page
2. Filter by Scheme → Branch → Class
3. Add individual students or import via CSV
4. Use bulk selection for activate/deactivate operations
5. Edit or delete student records as needed

## 🔧 Configuration

### Assessment Types
- **CIE-I**: First Continuous Internal Evaluation
- **CIE-II**: Second Continuous Internal Evaluation
- **CIE-III**: Third Continuous Internal Evaluation

### Bloom's Taxonomy Levels
- **CL1**: Remember
- **CL2**: Understand
- **CL3**: Apply
- **CL4**: Analyze
- **CL5**: Evaluate
- **CL6**: Create

---

**Built with ❤️ for Outcome-Based Education**
