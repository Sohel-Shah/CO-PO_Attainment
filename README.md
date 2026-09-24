# OBC Software Suite - CO-PO Attainment System

A comprehensive Outcome-Based Education (OBE) and CO-PO Attainment System designed for educational institutions to track, measure, and report on Course Outcomes (COs) and Program Outcomes (POs).

## Features

- **Course & Syllabus Management**: Create courses, define teaching plans, align syllabus with standard curriculum guidelines.
- **Outcome Mapping (CO-PO)**: Dynamically map Course Outcomes to Program Outcomes (POs) and Program Specific Outcomes (PSOs).
- **Roster & Attendance**: Manage student enrollments, batch years, and track per-lecture attendance tied to teaching plans.
- **Examination & Marks Entry**: Configure Internal and End-Semester Exams with detailed question-level mappings to COs and Bloom's Taxonomy. Input and track marks efficiently with boundary validations.
- **Attainment Analytics**: Automatically compute Direct and Indirect CO attainments using customizable thresholds. Cross-reference CO attainment with PO mapping to calculate overall Program Attainment.
- **Feedback & Surveys**: Collect student exit feedback and graduate/alumni surveys to measure Indirect Attainment.
- **IQAC Reporting**: Generate standardized Internal Quality Assurance Cell (IQAC) audit reports dynamically based on live data.
- **Role-Based Access Control**: Secure Admin and Faculty roles to prevent unauthorized modifications.

## Technology Stack

- **Frontend**: React.js (Vite), React Router, Context API / `useReducer` for state management, Vanilla CSS (Custom Design System).
- **Backend**: Node.js, Express.js microservices architecture.
- **Database**: PostgreSQL with Prisma ORM.
- **Testing**: Playwright for End-to-End (E2E) UI and integration testing.

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

## Setup Instructions

1. **Clone the repository** and install dependencies:
   ```bash
   cd "OBC Software New"
   
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Configure Environment Variables**:
   In the `backend` directory, create or modify the `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/obc_db?schema=public"
   PORT=3001
   ```

3. **Database Setup & Seeding**:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   node seed.js  # Seeds demo data including the complete 'Refrigeration and Air Conditioning' course
   ```

4. **Run the Application**:
   Open two terminal windows:
   
   *Terminal 1 (Backend)*:
   ```bash
   cd backend
   npm run dev
   ```
   
   *Terminal 2 (Frontend)*:
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**:
   Navigate to `http://localhost:5174` in your browser.

## Demo Credentials

- **Admin Account**: 
  - Login Name: `Test Admin`
  - Role: `ADMIN (HOD / IQAC)`
- **Faculty Account**:
  - Login Name: `Dr. A. Sharma` (or `Normal Faculty`)
  - Role: `FACULTY`

*(Note: The login system currently operates on a name-based selection for demonstration and E2E testing purposes).*

## Project Architecture

The project employs a robust separation of concerns:
- `backend/prisma/schema.prisma`: Centralized database schema managing all relational constraints.
- `backend/services/`: Microservices handling specific domains (Academic, Assessment, Student, Report).
- `frontend/src/utils/attainmentCalculator.js`: Complex attainment algorithms decoupled from UI components.
- `e2e-tests/`: Comprehensive Playwright test suites spanning Happy Path and Edge Cases.
