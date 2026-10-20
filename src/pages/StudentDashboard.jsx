import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as dataService from '../lib/dataService'
import { lessons } from '../data/sampleCourse'

const TIER_ORDER = ['basic', 'intermediate', 'advanced']

export default function StudentDashboard() {
  const { user } = useAuth()
  const [progress, setProgress] = useState([])
  const recommendedTier = localStorage.getItem(`recommendedTier:${user.id}`) || null

  useEffect(() => {
    dataService.getProgressForStudent(user.id).then(setProgress)
  }, [user.id])

  function statusFor(lessonId) {
    const p = progress.find((p) => (p.lessonId || p.lesson_id) === lessonId)
    return p?.status || 'not_started'
  }

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
    </div>
  )
}
