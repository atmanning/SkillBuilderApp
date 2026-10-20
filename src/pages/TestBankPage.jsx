import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as dataService from '../lib/dataService'
import { lessons } from '../data/sampleCourse'

export default function TestBankPage() {
  const { lessonId } = useParams()
  const { user } = useAuth()
  const lesson = lessons.find((l) => l.id === lessonId)
  const [customQuestions, setCustomQuestions] = useState([])
  const [prompt, setPrompt] = useState('')
  const [choices, setChoices] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [status, setStatus] = useState('')

  async function load() {
    const qs = await dataService.listCustomQuestions(lessonId)
    setCustomQuestions(qs)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  async function handleAdd(e) {
    e.preventDefault()
    setStatus('')
    if (choices.some((c) => !c.trim())) {
      setStatus('Fill in all four answer choices.')
      return
    }
    try {
      await dataService.addCustomQuestion({
        teacherId: user.id,
        lessonId,
        prompt,
        choices,
        correctIndex,
      })
      setPrompt('')
      setChoices(['', '', '', ''])
      setCorrectIndex(0)
      setStatus('Question added.')
      load()
    } catch (err) {
      setStatus(err.message)
    }
  }

  if (!lesson) return <p>Lesson not found.</p>

  return (
    <div className="page">
      <Link to="/teacher" className="btn-link">
        &larr; Back to dashboard
      </Link>
      <h1>Test bank: {lesson.title}</h1>

      <section className="card">
        <h2>Add a question</h2>
        <form onSubmit={handleAdd} className="stacked-form">
          <label>
            Question prompt
            <textarea
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
            />
          </label>
          {choices.map((c, i) => (
            <label key={i}>
              Choice {String.fromCharCode(65 + i)}
              <input
                type="text"
                required
                value={c}
                onChange={(e) => {
                  const next = [...choices]
                  next[i] = e.target.value
                  setChoices(next)
                }}
              />
            </label>
          ))}
          <label>
            Correct choice
            <select value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))}>
              {choices.map((_, i) => (
                <option key={i} value={i}>
                  {String.fromCharCode(65 + i)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Add to test bank</button>
        </form>
        {status && <p className="hint-text">{status}</p>}
      </section>

      <section className="card">
        <h2>Your questions for this lesson</h2>
        {customQuestions.length === 0 && <p className="muted">None added yet.</p>}
        <ol>
          {customQuestions.map((q) => (
            <li key={q.id}>{q.prompt}</li>
          ))}
        </ol>
      </section>
    </div>
  )
}
