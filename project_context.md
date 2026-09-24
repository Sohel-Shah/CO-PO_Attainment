# OBC Software New - Project Context

This document provides a comprehensive and detailed overview of the "OBC Software New" (CO-PO Attainment Studio) project. It is intended to be used as context for Claude or other AI coding assistants.

## 1. Project Overview & Architecture
The project is a web-based "CO-PO Attainment Studio" designed for academic institutions to manage courses, students, exams, question papers, marks, and map Course Outcomes (COs) to Program Outcomes (POs).

The system uses a modern web stack:
- **Frontend**: React (Vite), React Router v7, Recharts, Lucide-React.
- **Backend**: Node.js, Express (Microservices Architecture), Prisma ORM, PostgreSQL.
- **Architecture Pattern**: The backend follows a microservices pattern behind an API Gateway (`gateway/server.js`). All frontend API calls go through the Gateway on port `3001`, which proxies them to the respective microservices.
- **State Management**: The frontend uses a giant `useReducer` hook inside `App.jsx` to manage all course-related state (`st`), and implements an auto-sync mechanism (`/api/v2/sync-full`) to continuously save the local state to the backend database.

---

## 2. Tech Stack & Dependencies

### Backend (`backend/package.json`)
- **Core**: `express`, `cors`, `dotenv`
- **Database**: `@prisma/client` v6.19.2 (PostgreSQL)
- **Security & Auth**: `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`
- **Architecture**: `express-http-proxy` (API Gateway), `concurrently` (Running microservices)

### Frontend (`frontend/package.json`)
- **Core**: `react` v19.2.0, `react-dom` v19.2.0, `vite`
- **Routing**: `react-router-dom` v7.13.1
- **UI & Data Viz**: `recharts` v3.8.1, `lucide-react`
- **Linting**: `eslint`

---

## 3. Directory Structure

```
D:\Kunal_18-2-26\OBC Software New\
│
├── frontend/                     # React Vite Application
│   ├── src/
│   │   ├── components/           # React Components (Dashboard, Plans, Attendance, Examinations, etc.)
│   │   ├── utils/                # UI utilities and Attainment Calculators
│   │   ├── App.jsx               # Main Routing & Global State (useReducer)
│   │   ├── index.css             # Main stylesheet with CSS variables
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Express Microservices backend
│   ├── gateway/                  # API Gateway (Express HTTP Proxy) - Port 3001
│   ├── services/                 # Microservices
│   │   ├── auth/                 # Port 3002
│   │   ├── academic/             # Port 3003
│   │   ├── student/              # Port 3004
│   │   ├── assessment/           # Port 3005
│   │   ├── management/           # Port 3006 (Handles V2 Sync logic)
│   │   └── report/               # Port 3007
│   ├── prisma/                   # Prisma Schema & Migrations
│   │   └── schema.prisma         # Database schema
│   ├── package.json
│   └── seed.js                   # Database seeding script
```

---

## 4. Backend Gateway Routes (`backend/gateway/server.js`)
The API Gateway runs on **Port 3001** and routes traffic to microservices:
- `/api/auth`, `/api/faculty`, `/api/users` ➔ **Auth Service (3002)**
- `/api/courses`, `/api/pos` ➔ **Academic Service (3003)**
- `/api/students` ➔ **Student Service (3004)**
- `/api/exams`, `/api/papers`, `/api/marks`, `/api/feedback` ➔ **Assessment Service (3005)**
- `/api/v2`, `/api/state` ➔ **Management/Sync Service (3006)**
- `/api/report` ➔ **Report Service (3007)**
- `/` ➔ **UI Proxy (5174)** (Fallback for serving the frontend)

---

## 5. Frontend State Management (`frontend/src/App.jsx`)
The frontend uses a global `useReducer` in `App.jsx` to handle the `st` (state) object. This state holds the active course data:
- `coursePlan` (Teaching Plan, Pedagogy, Syllabus, Units)
- `students` (Student roster)
- `attendance` (Student attendance tracking)
- `exams` & `papers` (Exams setup and generated question papers)
- `marksState` (Marks obtained by students per question)
- `courseOutcomes` (COs) and `copoMap` (CO to PO mappings)

**Auto-Sync Mechanism**: 
`App.jsx` includes a `useEffect` hook that triggers an auto-save whenever `st.lastChangedBy === 'user'`. It sends the entire `st` payload via a `POST /api/v2/sync-full` request to the Management Service, which parses the JSON and upserts records via Prisma into the relational database.

---

## 6. Complete Database Schema (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Faculty {
  id         String   @id @default(uuid())
  name       String
  email      String?  @unique
  department String?
  misNumber  String?  @unique
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  courses    Course[]

  @@map("faculty")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   @default("password")
  role      String   @default("admin")
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("app_user")
}

model Course {
  id             String          @id @default(uuid())
  courseId       String          @unique
  name           String
  code           String?
  courseType     String?
  department     String?
  semester       String?
  credits        Float?
  lectureHrs     Int?
  tutorialHrs    Int?
  practicalHrs   Int?
  selfStudyHrs   Int?
  academicYear   String?
  programName    String?
  misNumber      String?
  totalStudents  Int?
  theoryMSE      Int?
  theoryTE       Int?
  theoryESE      Int?
  labISE         Int?
  labESE         Int?
  facultyId      String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  teachingPlan   Json?
  units          Json?
  pedagogyTools  Json?
  references     Json?
  settings       Json?
  coTargetPct    Int?            @default(60)
  directWeight   Int?            @default(80)
  indirectWeight Int?            @default(20)
  attendance     Attendance[]
  faculty        Faculty?        @relation(fields: [facultyId], references: [id])
  courseOutcomes CourseOutcome[]
  enrollments    Enrollment[]
  exams          Exam[]
  questionPapers QuestionPaper[]

  @@map("course")
}

model CourseOutcome {
  id                     String                  @id @default(uuid())
  courseId               String
  coNumber               String
  description            String
  bloomLevel             String?
  createdAt              DateTime                @default(now())
  updatedAt              DateTime                @updatedAt
  copoMappings           COPOMapping[]
  course                 Course                  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  feedbacks              Feedback[]
  marks                  Mark[]
  questions              Question[]
  questionPaperQuestions QuestionPaperQuestion[]

  @@unique([courseId, coNumber])
  @@map("course_outcome")
}

model PO {
  id           String        @id @default(uuid())
  poId         String        @unique
  description  String
  type         String
  copoMappings COPOMapping[]

  @@map("po")
}

model COPOMapping {
  id               String        @id @default(uuid())
  courseOutcomeId  String
  poId             String
  correlationLevel Int
  courseOutcome    CourseOutcome @relation(fields: [courseOutcomeId], references: [id], onDelete: Cascade)
  po               PO            @relation(fields: [poId], references: [id])

  @@unique([courseOutcomeId, poId])
  @@map("copo_mapping")
}

model Student {
  id          String       @id @default(uuid())
  rollNumber  String       @unique
  name        String
  email       String?
  batchYear   String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  misNumber   String?      @unique
  attendance  Attendance[]
  enrollments Enrollment[]
  feedbacks   Feedback[]
  marks       Mark[]

  @@map("student")
}

model Enrollment {
  id        String   @id @default(uuid())
  studentId String
  courseId  String
  createdAt DateTime @default(now())
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId])
  @@map("enrollment")
}

model Exam {
  id           String     @id @default(uuid())
  courseId     String
  title        String
  type         String
  totalMarks   Int
  date         DateTime?
  duration     String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  misNumber    String?
  academicYear String?
  course       Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  questions    Question[]

  @@map("exam")
}

model Question {
  id              String         @id @default(uuid())
  examId          String
  label           String
  maxMarks        Float
  courseOutcomeId String?
  bloomLevel      String?
  unitNo          String?
  questionText    String?
  createdAt       DateTime       @default(now())
  marks           Mark[]
  courseOutcome   CourseOutcome? @relation(fields: [courseOutcomeId], references: [id])
  exam            Exam           @relation(fields: [examId], references: [id], onDelete: Cascade)

  @@map("question")
}

model Mark {
  id              String         @id @default(uuid())
  studentId       String
  questionId      String
  courseOutcomeId String?
  marksObtained   Float
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  academicYear    String?
  examType        String?
  misNumber       String?
  courseOutcome   CourseOutcome? @relation(fields: [courseOutcomeId], references: [id])
  question        Question       @relation(fields: [questionId], references: [id], onDelete: Cascade)
  student         Student        @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, questionId])
  @@map("mark")
}

model Feedback {
  id              String         @id @default(uuid())
  studentId       String?
  courseOutcomeId String?
  rating          Int
  createdAt       DateTime       @default(now())
  category        String?
  text            String?
  courseOutcome   CourseOutcome? @relation(fields: [courseOutcomeId], references: [id])
  student         Student?       @relation(fields: [studentId], references: [id])

  @@map("feedback")
}

model QuestionPaper {
  id         String                  @id @default(uuid())
  courseId   String
  title      String
  type       String
  totalMarks Int
  date       String?
  duration   String?
  createdAt  DateTime                @default(now())
  updatedAt  DateTime                @updatedAt
  course     Course                  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  questions  QuestionPaperQuestion[]

  @@map("question_paper")
}

model QuestionPaperQuestion {
  id              String         @id @default(uuid())
  paperId         String
  section         String?
  questionText    String
  marks           Int
  type            String?
  courseOutcomeId String?
  createdAt       DateTime       @default(now())
  courseOutcome   CourseOutcome? @relation(fields: [courseOutcomeId], references: [id])
  paper           QuestionPaper  @relation(fields: [paperId], references: [id], onDelete: Cascade)

  @@map("question_paper_question")
}

model Attendance {
  id        String   @id @default(uuid())
  studentId String
  courseId  String
  key       String
  status    String
  createdAt DateTime @default(now())
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, courseId, key])
  @@map("attendance")
}
```
