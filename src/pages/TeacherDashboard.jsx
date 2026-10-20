import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as dataService from '../lib/dataService'
import { course, lessons } from '../data/sampleCourse'
import { totalScore, missedQuestionCount } from '../lib/scoring'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [roster, setRoster] = useState([])
  const [progress, setProgress] = useState([])
  const [questionAttempts, setQuestionAttempts] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState('')

  async function loadRosterAndProgress() {
    const r = await dataService.listRoster(user.id, course.id)
    setRoster(r)
    const ids = r.map((e) => e.studentId || e.student_id)
    if (ids.length) {
      const p = await dataService.getProgressForRoster(ids)
      setProgress(p)
      const qa = await dataService.getQuestionAttemptsForRoster(ids)
      setQuestionAttempts(qa)
    }
  }

  useEffect(() => {
    loadRosterAndProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleInvite(e) {
    e.preventDefault()
    setInviteStatus('')
    try {
      await dataService.inviteStudentByEmail({
        teacherId: user.id,
        courseId: course.id,
        studentEmail: inviteEmail,
      })
      setInviteStatus(`Invited ${inviteEmail}.`)
      setInviteEmail('')
      loadRosterAndProgress()
    } catch (err) {
      setInviteStatus(err.message)
    }
  }

  function progressFor(studentId) {
    return progress.filter((p) => (p.studentId || p.student_id) === studentId)
  }

  function questionAttemptsFor(studentId) {
    return questionAttempts.filter((a) => a.studentId === studentId)
  }

  return (
    <div className="page">
      <h1>Teacher Dashboard</h1>
      <p className="muted">
        Course: <strong>{course.title}</strong>
      </p>

      <section className="card">
        <h2>Invite a student</h2>
        <p className="muted">
          The student must already have a SkillBuilder account (any role self-registers
          from the login page in this starter). In production this could instead send an
          email invite that creates the account on acceptance.
        </p>
        <form className="inline-form" onSubmit={handleInvite}>
          <input
            type="email"
            placeholder="student@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <button type="submit">Invite</button>
        </form>
        {inviteStatus && <p className="hint-text">{inviteStatus}</p>}
      </section>

      <section className="card">
        <h2>Roster & progress</h2>
        {roster.length === 0 && <p className="muted">No students invited yet.</p>}
        {roster.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Lessons started</th>
                <th>Lessons mastered</th>
                <th>Needs review</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const sid = r.studentId || r.student_id
                const sp = progressFor(sid)
                const mastered = sp.filter((p) => p.status === 'mastered').length
                const qa = questionAttemptsFor(sid)
                const studentInfo = r.student || r.profiles
                return (
                  <tr key={sid}>
                    <td>{studentInfo?.name || studentInfo?.email || sid}</td>
                    <td>{totalScore(qa)} pts</td>
                    <td>{sp.length}</td>
                    <td>{mastered}</td>
                    <td>{missedQuestionCount(qa)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Lessons &amp; test bank</h2>
        <ul className="plain-list">
          {lessons.map((l) => (
            <li key={l.id}>
              {l.title} ({l.tier}) &mdash;{' '}
              <Link to={`/teacher/test-bank/${l.id}`}>manage questions</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Practice sandbox</h2>
        <p className="muted">
          Students practice writing real SQL against a Northwind database. By default
          this runs entirely in their browser (SQLite, no setup). You can optionally
          connect it to a live MySQL server instead.
        </p>
        <Link to="/teacher/mysql-setup">
          <button>Configure live MySQL server</button>
        </Link>
      </section>
    </div>
  )
}
