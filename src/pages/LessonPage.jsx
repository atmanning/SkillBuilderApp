import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as dataService from '../lib/dataService'
import { lessons } from '../data/sampleCourse'
import { MAX_REVIEW_PASSES } from '../lib/scoring'
import { reviewRoundIntro, lessonCompleteMessage } from '../lib/encouragement'
import QuestionCard from '../components/QuestionCard'

// Orchestrates one lesson's quiz as a sequence of "passes": pass 1 asks
// every question once; any question not answered correctly within its
// attempt limit (see QuestionCard / scoring.js) gets collected and
// requeued as pass 2, asking only the missed ones -- this is the
// "circle back to questions they've missed" behavior. This repeats up to
// MAX_REVIEW_PASSES times, so a student isn't stuck in an endless loop
// on a question they're genuinely not getting yet; it'll still show up
// as needing review on their dashboard afterward.
export default function LessonPage() {
  const { lessonId } = useParams()
  const { user } = useAuth()
  const lesson = lessons.find((l) => l.id === lessonId)

  const [phase, setPhase] = useState('loading') // loading | quiz | review-intro | complete
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [passNumber, setPassNumber] = useState(1)
  const [missedThisPass, setMissedThisPass] = useState([])
  const [sessionPoints, setSessionPoints] = useState(0)
  const [resultsByQuestionId, setResultsByQuestionId] = useState({})
  const [reviewMessage, setReviewMessage] = useState('')

  useEffect(() => {
    dataService.getQuestionsForLesson(lessonId).then((qs) => {
      setQueue(qs)
      setPhase(qs.length > 0 ? 'quiz' : 'complete')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  async function handleResolved(question, result) {
    await dataService.recordQuestionAttempt({
      studentId: user.id,
      lessonId,
      questionId: question.id,
      points: result.points,
      correct: result.correct,
    })
    setSessionPoints((p) => p + result.points)
    setResultsByQuestionId((prev) => ({
      ...prev,
      [question.id]: { correct: result.correct },
    }))
    if (!result.correct) {
      setMissedThisPass((prev) => [...prev, question])
    }
  }

  async function finishLesson(finalResults) {
    const entries = Object.values(finalResults)
    const correctCount = entries.filter((r) => r.correct).length
    await dataService.recordLessonResult({
      studentId: user.id,
      lessonId,
      correctCount,
      totalCount: entries.length,
    })
    setPhase('complete')
  }

  function handleContinue() {
    const isLastInQueue = currentIndex + 1 >= queue.length

    if (!isLastInQueue) {
      setCurrentIndex((i) => i + 1)
      return
    }

    // End of this pass -- decide whether to requeue missed questions or finish.
    if (missedThisPass.length > 0 && passNumber < MAX_REVIEW_PASSES) {
      setQueue(missedThisPass)
      setMissedThisPass([])
      setCurrentIndex(0)
      setPassNumber((p) => p + 1)
      setReviewMessage(reviewRoundIntro())
      setPhase('review-intro')
    } else {
      finishLesson(resultsByQuestionId)
    }
  }

  if (!lesson) return <p>Lesson not found.</p>

  const currentQuestion = queue[currentIndex]
  const totalUniqueAnswered = Object.keys(resultsByQuestionId).length
  const totalMastered = Object.values(resultsByQuestionId).filter((r) => r.correct).length

  return (
    <div className="page">
      <Link to="/student" className="btn-link">
        &larr; Back to my lessons
      </Link>
      <h1>{lesson.title}</h1>

      <section className="card">
        <h2>Reference material</h2>
        <p className="muted">
          Embedded tutorial content (placeholder link below -- swap for your own hosted
          material or a licensed embed).
        </p>
        <a href={lesson.embedUrl} target="_blank" rel="noreferrer">
          Open reference tutorial &#8599;
        </a>
      </section>

      <section className="card">
        <div className="score-bar">
          <span>
            Score this lesson: <strong>{sessionPoints} pts</strong>
          </span>
          {phase === 'quiz' && (
            <span className="muted">
              Question {currentIndex + 1} of {queue.length}
              {passNumber > 1 ? ` (review round ${passNumber - 1})` : ''}
            </span>
          )}
        </div>

        {phase === 'loading' && <p className="muted">Loading questions...</p>}

        {phase === 'quiz' && currentQuestion && (
          <QuestionCard
            key={`${currentQuestion.id}-pass${passNumber}`}
            question={currentQuestion}
            onResolved={(result) => handleResolved(currentQuestion, result)}
            onContinue={handleContinue}
          />
        )}

        {phase === 'review-intro' && (
          <div>
            <p className="hint-text">{reviewMessage}</p>
            <button onClick={() => setPhase('quiz')}>Start review round</button>
          </div>
        )}

        {phase === 'complete' && (
          <div>
            <p>{lessonCompleteMessage()}</p>
            <p>
              You earned <strong>{sessionPoints} points</strong> this session, mastering{' '}
              {totalMastered} of {totalUniqueAnswered} questions
              {totalUniqueAnswered > 0 && totalMastered / totalUniqueAnswered >= 0.8
                ? ' -- lesson mastered!'
                : '.'}
            </p>
            <Link to="/student">
              <button>Back to my lessons</button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
