// encouragement.js
//
// Small phrase banks so feedback doesn't feel robotic or repetitive.
// Picked randomly per event rather than cycled, so a student answering
// several questions in a row doesn't see an obviously rotating pattern.

const CORRECT_FIRST_TRY = [
  'Nice work!',
  "You've got it!",
  'Exactly right!',
  'Great job!',
  'Correct -- well done!',
]

const CORRECT_AFTER_RETRY = [
  "There you go -- that's it!",
  'Got there! Nicely worked out.',
  "That's it. Good persistence!",
  'Correct -- see how that came together?',
]

const INCORRECT_TRY_AGAIN = [
  "Not quite -- take another look.",
  'Close, but not it yet. Give it another try.',
  "That's not it yet -- want a hint?",
  'Not quite right. One more try?',
]

const REVEAL_AFTER_LIMIT = [
  "No worries -- here's how it works. We'll come back to this one.",
  "Let's look at the answer together, and revisit this shortly.",
  "This one's tricky. Here's the idea -- we'll circle back to it.",
]

const REVIEW_ROUND_INTRO = [
  "Let's circle back to a couple you missed earlier -- you've got this.",
  'Quick review round. These will stick this time!',
  "One more pass on a few tricky ones. You're doing great.",
]

const LESSON_COMPLETE = [
  'Lesson complete! Nice work today.',
  "You made it through -- great effort.",
  'All done! Your SQL skills are growing.',
]

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function correctFeedback({ firstTry }) {
  return pick(firstTry ? CORRECT_FIRST_TRY : CORRECT_AFTER_RETRY)
}

export function incorrectFeedback() {
  return pick(INCORRECT_TRY_AGAIN)
}

export function revealFeedback() {
  return pick(REVEAL_AFTER_LIMIT)
}

export function reviewRoundIntro() {
  return pick(REVIEW_ROUND_INTRO)
}

export function lessonCompleteMessage() {
  return pick(LESSON_COMPLETE)
}
