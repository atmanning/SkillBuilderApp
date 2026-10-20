import { useState } from 'react'
import {
  MAX_ATTEMPTS_PER_PASS,
  pointsForAttempt,
  isFillBlankCorrect,
} from '../lib/scoring'
import { correctFeedback, incorrectFeedback, revealFeedback } from '../lib/encouragement'

// Renders a single question (multiple_choice or fill_blank) and manages
// its own attempt/hint/feedback state. Calls onResolved exactly once per
// question, when the question is either answered correctly or has used
// up its attempts for this pass -- LessonPage uses that to award points,
// log the attempt, and decide whether this question needs to be
// requeued for review.
//
// onResolved receives: { correct: boolean, attemptNumber: number, usedHint: boolean, points: number }
// onResolved fires once, as soon as the question is settled (correct, or
// out of attempts), so LessonPage can log the point/attempt immediately.
// onContinue fires separately when the student clicks "Continue" after
// reading the feedback -- that's what actually advances LessonPage to the
// next question, so feedback never gets yanked away before it's read.
export default function QuestionCard({ question, onResolved, onContinue }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [attemptNumber, setAttemptNumber] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState(null) // { kind: 'correct'|'incorrect'|'revealed', message, correctAnswerText? }
  const [resolved, setResolved] = useState(false)

  function checkCorrectness() {
    if (question.questionType === 'fill_blank') {
      return isFillBlankCorrect(textAnswer, question.acceptableAnswers)
    }
    return selectedIndex === question.correctIndex
  }

  function handleSubmit() {
    if (resolved) return
    const nextAttemptNumber = attemptNumber + 1
    setAttemptNumber(nextAttemptNumber)
    const isCorrect = checkCorrectness()

    if (isCorrect) {
      const points = pointsForAttempt({ attemptNumber: nextAttemptNumber, usedHint })
      setFeedback({
        kind: 'correct',
        message: correctFeedback({ firstTry: nextAttemptNumber === 1 && !usedHint }),
      })
      setResolved(true)
      onResolved({ correct: true, attemptNumber: nextAttemptNumber, usedHint, points })
      return
    }

    if (nextAttemptNumber >= MAX_ATTEMPTS_PER_PASS) {
      const correctAnswerText =
        question.questionType === 'fill_blank'
          ? question.acceptableAnswers[0]
          : question.choices[question.correctIndex]
      setFeedback({ kind: 'revealed', message: revealFeedback(), correctAnswerText })
      setResolved(true)
      onResolved({ correct: false, attemptNumber: nextAttemptNumber, usedHint, points: 0 })
      return
    }

    setFeedback({ kind: 'incorrect', message: incorrectFeedback() })
  }

  function handleShowHint() {
    setUsedHint(true)
    setShowHint(true)
  }

  const canSubmit =
    !resolved &&
    (question.questionType === 'fill_blank' ? textAnswer.trim().length > 0 : selectedIndex !== null)

  return (
    <div className="quiz-question">
      <p className="question-prompt">
        {question.prompt.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            <br />
          </span>
        ))}
      </p>

      {question.questionType === 'fill_blank' ? (
        <input
          type="text"
          className="fill-blank-input"
          value={textAnswer}
          disabled={resolved}
          onChange={(e) => setTextAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) handleSubmit()
          }}
          placeholder="Type your answer"
        />
      ) : (
        question.choices.map((c, ci) => (
          <label key={ci} className="choice-row">
            <input
              type="radio"
              name={question.id}
              disabled={resolved}
              checked={selectedIndex === ci}
              onChange={() => setSelectedIndex(ci)}
            />
            {c}
          </label>
        ))
      )}

      <div className="sandbox-actions">
        {!resolved && (
          <button onClick={handleSubmit} disabled={!canSubmit}>
            Submit answer
          </button>
        )}
        {!resolved && !showHint && question.hint && (
          <button type="button" className="btn-link" onClick={handleShowHint}>
            Show hint
          </button>
        )}
      </div>

      {showHint && !resolved && <p className="hint-text">Hint: {question.hint}</p>}

      {feedback && (
        <p className={`feedback-text feedback-${feedback.kind}`}>
          {feedback.message}
          {feedback.kind === 'revealed' && (
            <>
              {' '}
              Correct answer: <strong>{feedback.correctAnswerText}</strong>
            </>
          )}
        </p>
      )}

      {resolved && (
        <button onClick={onContinue}>Continue</button>
      )}
    </div>
  )
}
