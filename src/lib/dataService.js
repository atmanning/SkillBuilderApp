// dataService.js
//
// A single abstraction layer for all persistence (auth, enrollments,
// progress, and the custom question bank). Every function here checks
// `isSupabaseConfigured` and either talks to Supabase or falls back to a
// localStorage-backed mock. This means:
//   1. The app runs and is fully demoable with zero backend setup.
//   2. Once you add real Supabase credentials to .env.local, the exact same
//      function calls throughout the app start persisting to a real
//      Postgres database -- no component code needs to change.
//
// See /supabase/schema.sql for the table definitions these calls assume
// once Supabase is configured.

import { supabase, isSupabaseConfigured } from './supabaseClient'
import { lessons as sampleLessons } from '../data/sampleCourse'

const LS_KEYS = {
  users: 'sb_mock_users',
  session: 'sb_mock_session',
  progress: 'sb_mock_progress',
  customQuestions: 'sb_mock_custom_questions',
  enrollments: 'sb_mock_enrollments',
}

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export async function signUp({ email, password, name, role }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // The companion `profiles` table (see schema.sql) stores role/name,
    // keyed by the auth user's id. A Supabase trigger or this insert
    // keeps it in sync on sign-up.
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name, role, email })
    }
    return data.user
  }

  // --- local mock fallback ---
  const users = readLS(LS_KEYS.users, [])
  if (users.some((u) => u.email === email)) {
    throw new Error('An account with that email already exists.')
  }
  const user = { id: crypto.randomUUID(), email, password, name, role }
  users.push(user)
  writeLS(LS_KEYS.users, users)
  writeLS(LS_KEYS.session, { userId: user.id })
  return user
}

export async function signIn({ email, password }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }

  const users = readLS(LS_KEYS.users, [])
  const user = users.find((u) => u.email === email && u.password === password)
  if (!user) throw new Error('Invalid email or password.')
  writeLS(LS_KEYS.session, { userId: user.id })
  return user
}

export async function signOut() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
    return
  }
  localStorage.removeItem(LS_KEYS.session)
}

export async function getCurrentUser() {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    return { ...data.user, ...profile }
  }

  const session = readLS(LS_KEYS.session, null)
  if (!session) return null
  const users = readLS(LS_KEYS.users, [])
  return users.find((u) => u.id === session.userId) || null
}

// ---------------------------------------------------------------------
// Enrollments (teacher invites students into the course)
// ---------------------------------------------------------------------

export async function listRoster(teacherId, courseId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, profiles:student_id(name, email)')
      .eq('teacher_id', teacherId)
      .eq('course_id', courseId)
    if (error) throw error
    return data
  }

  const enrollments = readLS(LS_KEYS.enrollments, [])
  const users = readLS(LS_KEYS.users, [])
  return enrollments
    .filter((e) => e.teacherId === teacherId && e.courseId === courseId)
    .map((e) => ({
      ...e,
      student: users.find((u) => u.id === e.studentId),
    }))
}

export async function inviteStudentByEmail({ teacherId, courseId, studentEmail }) {
  if (isSupabaseConfigured) {
    // In a real deployment this would look up (or invite) the student's
    // profile by email and insert an enrollments row referencing their id.
    const { data: student, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', studentEmail)
      .single()
    if (lookupError || !student) {
      throw new Error('No student account found with that email yet.')
    }
    const { error } = await supabase
      .from('enrollments')
      .insert({ teacher_id: teacherId, course_id: courseId, student_id: student.id })
    if (error) throw error
    return
  }

  const users = readLS(LS_KEYS.users, [])
  const student = users.find((u) => u.email === studentEmail && u.role === 'student')
  if (!student) throw new Error('No student account found with that email yet.')

  const enrollments = readLS(LS_KEYS.enrollments, [])
  enrollments.push({
    id: crypto.randomUUID(),
    teacherId,
    courseId,
    studentId: student.id,
    invitedAt: new Date().toISOString(),
  })
  writeLS(LS_KEYS.enrollments, enrollments)
}

export async function listMyEnrolledCourses(studentId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId)
    if (error) throw error
    return data.map((d) => d.course_id)
  }

  const enrollments = readLS(LS_KEYS.enrollments, [])
  return enrollments.filter((e) => e.studentId === studentId).map((e) => e.courseId)
}

// ---------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------

export async function recordLessonResult({ studentId, lessonId, correctCount, totalCount }) {
  const score = totalCount > 0 ? correctCount / totalCount : 0
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('student_progress').upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        score,
        attempts: 1, // see schema.sql trigger note for incrementing on conflict
        status: score >= 0.8 ? 'mastered' : 'in_progress',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,lesson_id' }
    )
    if (error) throw error
    return
  }

  const progress = readLS(LS_KEYS.progress, [])
  const existingIndex = progress.findIndex(
    (p) => p.studentId === studentId && p.lessonId === lessonId
  )
  const record = {
    studentId,
    lessonId,
    score,
    status: score >= 0.8 ? 'mastered' : 'in_progress',
    attempts: existingIndex >= 0 ? progress[existingIndex].attempts + 1 : 1,
    updatedAt: new Date().toISOString(),
  }
  if (existingIndex >= 0) {
    progress[existingIndex] = record
  } else {
    progress.push(record)
  }
  writeLS(LS_KEYS.progress, progress)
}

export async function getProgressForStudent(studentId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
    if (error) throw error
    return data
  }
  const progress = readLS(LS_KEYS.progress, [])
  return progress.filter((p) => p.studentId === studentId)
}

export async function getProgressForRoster(studentIds) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .in('student_id', studentIds)
    if (error) throw error
    return data
  }
  const progress = readLS(LS_KEYS.progress, [])
  return progress.filter((p) => studentIds.includes(p.studentId))
}

// ---------------------------------------------------------------------
// Custom question bank (teacher-authored questions layered onto lessons)
// ---------------------------------------------------------------------

export async function addCustomQuestion({ teacherId, lessonId, prompt, choices, correctIndex }) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('custom_questions').insert({
      teacher_id: teacherId,
      lesson_id: lessonId,
      prompt,
      choices,
      correct_index: correctIndex,
    })
    if (error) throw error
    return
  }

  const custom = readLS(LS_KEYS.customQuestions, [])
  custom.push({
    id: crypto.randomUUID(),
    teacherId,
    lessonId,
    prompt,
    choices,
    correctIndex,
    createdAt: new Date().toISOString(),
  })
  writeLS(LS_KEYS.customQuestions, custom)
}

export async function listCustomQuestions(lessonId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('lesson_id', lessonId)
    if (error) throw error
    return data
  }
  const custom = readLS(LS_KEYS.customQuestions, [])
  return custom.filter((q) => q.lessonId === lessonId)
}

// Merges a lesson's built-in sample questions with any teacher-added
// questions from the test bank, so LessonPage only has to call one function.
export async function getQuestionsForLesson(lessonId) {
  const base = sampleLessons.find((l) => l.id === lessonId)?.questions || []
  const custom = await listCustomQuestions(lessonId)
  return [...base, ...custom]
}
