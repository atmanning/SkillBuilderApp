-- SkillBuilderApp Supabase schema
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor)
-- after creating the project, BEFORE setting VITE_SUPABASE_URL /
-- VITE_SUPABASE_ANON_KEY in .env.local.

-- ---------------------------------------------------------------------
-- profiles: one row per auth user, holding app-specific fields
-- Supabase's built-in `auth.users` table already stores email/password;
-- this table extends it with a role and display name.
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('teacher', 'student')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Teachers need to look up a student's profile by email when inviting them,
-- and need to read roster members' profiles. A simple approach for this
-- starter: allow any authenticated user to read any profile's name/email.
-- Tighten this for production (e.g. restrict to only profiles of students
-- who share a course with the requesting teacher).
create policy "Authenticated users can read any profile"
  on profiles for select
  using (auth.role() = 'authenticated');


-- ---------------------------------------------------------------------
-- enrollments: links a teacher + course + student (the "invite" record)
-- course_id is a plain text slug here (e.g. 'sql-fundamentals') since
-- course content in this starter is defined in code
-- (src/data/sampleCourse.js) rather than in its own database table.
-- ---------------------------------------------------------------------
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  course_id text not null,
  student_id uuid not null references profiles(id) on delete cascade,
  invited_at timestamptz not null default now(),
  unique (course_id, student_id)
);

alter table enrollments enable row level security;

create policy "Teachers manage their own enrollments"
  on enrollments for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Students can read their own enrollments"
  on enrollments for select
  using (auth.uid() = student_id);


-- ---------------------------------------------------------------------
-- student_progress: one row per (student, lesson), upserted on each quiz
-- submission. lesson_id matches the string ids in
-- src/data/sampleCourse.js (e.g. 'lesson-basic-1').
-- ---------------------------------------------------------------------
create table if not exists student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  lesson_id text not null,
  score numeric not null,
  status text not null check (status in ('in_progress', 'mastered')),
  attempts integer not null default 1,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

alter table student_progress enable row level security;

create policy "Students manage their own progress"
  on student_progress for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- Teachers need to read progress for students on their roster. This
-- starter policy allows any authenticated user to read any progress row;
-- tighten it to join through `enrollments` for production use.
create policy "Authenticated users can read progress"
  on student_progress for select
  using (auth.role() = 'authenticated');


-- ---------------------------------------------------------------------
-- custom_questions: teacher-authored questions layered onto a lesson,
-- merged with the built-in sample questions by
-- dataService.getQuestionsForLesson().
-- ---------------------------------------------------------------------
create table if not exists custom_questions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  lesson_id text not null,
  prompt text not null,
  choices jsonb not null,
  correct_index integer not null,
  created_at timestamptz not null default now()
);

alter table custom_questions enable row level security;

create policy "Teachers manage their own custom questions"
  on custom_questions for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Authenticated users can read custom questions"
  on custom_questions for select
  using (auth.role() = 'authenticated');
