# SkillBuilderApp

A self-paced tutorial platform for teachers and students. Teachers create
courses, invite students, track progress, and extend a course's quiz
question bank with their own questions. Students take a short skill
assessment, then work through lessons leveled from basic through advanced.

The first demonstrated course, seeded in this starter, is **SQL Query
Skill Builder**: a SELECT-statement course running from basic filtering
through joins, aggregation, and subqueries.

Built with Vite + React + React Router, with a Supabase-backed data layer
that automatically falls back to a local, in-browser mock store when no
Supabase project is configured yet -- so the app is fully runnable and
demoable immediately after `npm install`.

## Quick start (no backend setup required)

```bash
npm install
npm run dev
```

Open the printed localhost URL. Register two accounts to try both sides:
one as a **teacher**, one as a **student** (use the role dropdown on the
registration form). As the teacher, invite the student by the email you
registered with. As the student, take the assessment, then work through
the recommended lessons.

With no Supabase credentials configured, all data (accounts, enrollments,
progress, custom questions) is stored in the browser's `localStorage` --
great for a demo, but it resets if you clear browser storage, and isn't
shared across devices/browsers.

## Connecting a real backend (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](./supabase/schema.sql) to create the required
   tables (`profiles`, `enrollments`, `student_progress`,
   `custom_questions`) and their row-level security policies.
3. In **Settings -> API**, copy your Project URL and anon/public key.
4. Copy `.env.example` to `.env.local` and fill in those two values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Restart `npm run dev`. The app now persists through Supabase instead
   of the local mock store -- no other code changes needed. This switch
   is handled by `src/lib/supabaseClient.js` and `src/lib/dataService.js`.

## Project structure

```
src/
  lib/
    supabaseClient.js   Supabase client + isSupabaseConfigured flag
    dataService.js      All reads/writes; Supabase-or-local-mock per call
  context/
    AuthContext.jsx      Current user/session, exposed via useAuth()
  data/
    sampleCourse.js      Seed content: lessons, questions, assessment
  components/
    Navbar.jsx, ProtectedRoute.jsx
  pages/
    LoginPage.jsx         Register / sign in, role selection
    TeacherDashboard.jsx  Invite students, view roster + progress
    TestBankPage.jsx      Add custom quiz questions to a lesson
    StudentDashboard.jsx  Lesson list grouped by difficulty tier
    AssessmentPage.jsx    Initial placement assessment
    LessonPage.jsx        Reference material + practice quiz
supabase/
  schema.sql             Table definitions + RLS policies for Supabase
```

## Where to take this next

- **Real SQL grading.** Lesson quizzes here are multiple-choice for
  simplicity. For free-response "write the query yourself" activities,
  consider running student queries against an in-browser SQLite engine
  (e.g. [sql.js](https://github.com/sql-js/sql.js)) loaded with sample
  data, and comparing the result set rather than the query text.
- **Richer course content model.** Lessons/questions currently live in
  `src/data/sampleCourse.js`. To let teachers build their *own* courses
  (not just add questions to this one), move lessons into a Supabase
  table too, following the same pattern as `custom_questions`.
- **Email-based invites.** `inviteStudentByEmail` currently requires the
  student to already have an account. Supabase Auth supports sending an
  actual invite email that creates the account on acceptance
  (`supabase.auth.admin.inviteUserByEmail`, via a server-side function).
- **Tighter RLS policies.** The Supabase policies in `schema.sql` are
  intentionally permissive for a starter (e.g. any authenticated user can
  read any profile). Tighten these to scope reads through the
  `enrollments` table before using this with real student data.

## Deployment

This app builds to static files (`npm run build` outputs to `dist/`), so
it can be hosted anywhere that serves static sites -- GitHub Pages,
Render's static site hosting, Netlify, Vercel, etc. Since all
persistence goes through Supabase's hosted API once configured, no
separate backend server is required for this starter.

Remember to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as
environment variables in your hosting platform's build settings (not
just in a local `.env.local`, which isn't committed to git).
