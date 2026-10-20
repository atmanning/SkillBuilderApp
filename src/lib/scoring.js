// scoring.js
//
// Shared rules for how a question is scored and how a fill-in-the-blank
// answer is matched, used by QuestionCard.jsx (the interaction) and
// LessonPage.jsx (the pass/review orchestration), so the two stay in sync.

export const POINTS_FIRST_TRY = 10
export const POINTS_AFTER_RETRY = 5
export const MAX_ATTEMPTS_PER_PASS = 2
export const MAX_REVIEW_PASSES = 3

// Points awarded for a question answered correctly, based on how many
// attempts it took (within a single pass) and whether a hint was used.
// A hint counts the same as a retry -- it shouldn't be "free" relative to
// just trying again, since both mean the student needed extra support.
export function pointsForAttempt({ attemptNumber, usedHint }) {
  if (attemptNumber === 1 && !usedHint) return POINTS_FIRST_TRY
  return POINTS_AFTER_RETRY
}

// Normalizes a fill-in-the-blank answer for comparison: trims whitespace,
// collapses internal whitespace runs to a single space, lowercases, and
// strips a single trailing semicolon -- SQL statements are valid with or
// without one, and we don't want that to be the difference between right
// and wrong.
export function normalizeFillBlankAnswer(value) {
  return value
    .trim()
    .replace(/;\s*$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function isFillBlankCorrect(studentAnswer, acceptableAnswers) {
  const normalizedStudent = normalizeFillBlankAnswer(studentAnswer)
  return acceptableAnswers.some(
    (accepted) => normalizeFillBlankAnswer(accepted) === normalizedStudent
  )
}

// --- Aggregation helpers used by StudentDashboard.jsx and
// TeacherDashboard.jsx to turn a list of question_attempts rows into the
// numbers actually shown on screen.

export function totalScore(attempts) {
  return attempts.reduce((sum, a) => sum + (a.points || 0), 0)
}

export function missedQuestionCount(attempts) {
  return attempts.filter((a) => !a.correct).length
}
