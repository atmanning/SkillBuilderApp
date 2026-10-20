import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as dataService from '../lib/dataService'
import { lessons } from '../data/sampleCourse'
import { totalScore, missedQuestionCount } from '../lib/scoring'

const TIER_ORDER = ['basic', 'intermediate', 'advanced']

export default function StudentDashboard() {
  const { user } = useAuth()
  const [progress, setProgress] = useState([])
  const [questionAttempts, setQuestionAttempts] = useState([])
  const recommendedTier = localStorage.getItem(`recommendedTier:${user.id}`) || null

  useEffect(() => {
    dataService.getProgressForStudent(user.id).then(setProgress)
    dataService.getQuestionAttemptsForStudent(user.id).then(setQuestionAttempts)
  }, [user.id])

  function statusFor(lessonId) {
    const p = progress.find((p) => (p.lessonId || p.lesson_id) === lessonId)
    return p?.status || 'not_started'
  }

  const score = totalScore(questionAttempts)
  const needsReview = missedQuestionCount(questionAttempts)

  if (!recommendedTier) {
    return (
      <div className="page">
        <h1>Welcome, {user.name}</h1>
        <section className="card">
          <h2>Start with a quick skill assessment</h2>
          <p className="muted">
            A short set of questions places you at the right starting difficulty so you
            aren't stuck re-doing material you already know, or dropped somewhere too hard.
          </p>
          <Link to="/assessment">
            <button>Take the assessment</button>
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>Welcome back, {user.name}</h1>
      <p className="muted">
        Recommended starting level: <strong>{recommendedTier}</strong>{' '}
        <Link to="/assessment" className="btn-link">
          (retake assessment)
        </Link>
      </p>

      <section className="card score-summary">
        <div>
          <span className="score-number">{score}</span>
          <span className="muted"> points earned</span>
        </div>
        {needsReview > 0 && (
          <p className="hint-text">
            {needsReview} question{needsReview === 1 ? '' : 's'} could use another look --
            revisit any lesson below to try them again.
          </p>
        )}
      </section>

      {TIER_ORDER.map((tier) => (
        <section className="card" key={tier}>
          <h2 style={{ textTransform: 'capitalize' }}>{tier}</h2>
          <ul className="plain-list">
            {lessons
              .filter((l) => l.tier === tier)
              .map((l) => (
                <li key={l.id}>
                  <Link to={`/lesson/${l.id}`}>{l.title}</Link>{' '}
                  <span className={`badge badge-${statusFor(l.id)}`}>
                    {statusFor(l.id).replace('_', ' ')}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <section className="card">
        <h2>Practice sandbox</h2>
        <p className="muted">
          Write and run real SQL queries against a sample Northwind database, right in
          your browser -- no setup required. Each challenge checks your query's results
          automatically.
        </p>
        <Link to="/sandbox">
          <button>Open the sandbox</button>
        </Link>
      </section>
    </div>
  )
}
