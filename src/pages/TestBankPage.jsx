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

  const [questionType, setQuestionType] = useState('multiple_choice')
  const [prompt, setPrompt] = useState('')
  const [hint, setHint] = useState('')
  const [choices, setChoices] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [acceptableAnswersText, setAcceptableAnswersText] = useState('')
  const [status, setStatus] = useState('')

  async function load() {
    const qs = await dataService.listCustomQuestions(lessonId)
    setCustomQuestions(qs)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  function resetForm() {
    setPrompt('')
    setHint('')
    setChoices(['', '', '', ''])
    setCorrectIndex(0)
    setAcceptableAnswersText('')
  }

  async function handleAdd(e) {
    e.preventDefault()
    setStatus('')

    if (questionType === 'multiple_choice' && choices.some((c) => !c.trim())) {
      setStatus('Fill in all four answer choices.')
      return
    }
    const acceptableAnswers = acceptableAnswersText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (questionType === 'fill_blank' && acceptableAnswers.length === 0) {
      setStatus('Enter at least one acceptable answer.')
      return
    }

    try {
      await dataService.addCustomQuestion({
        teacherId: user.id,
        lessonId,
        questionType,
        prompt,
        hint: hint.trim() || undefined,
        choices: questionType === 'multiple_choice' ? choices : undefined,
        correctIndex: questionType === 'multiple_choice' ? correctIndex : undefined,
        acceptableAnswers: questionType === 'fill_blank' ? acceptableAnswers : undefined,
      })
      resetForm()
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
            Question type
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
              <option value="multiple_choice">Multiple choice</option>
              <option value="fill_blank">Fill in the blank</option>
            </select>
          </label>

          <label>
            Question prompt
            <textarea
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
            />
          </label>

          {questionType === 'multiple_choice' ? (
            <>
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
                <select
                  value={correctIndex}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                >
                  {choices.map((_, i) => (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label>
              Acceptable answers (comma-separated -- any one counts as correct)
              <input
                type="text"
                required
                placeholder="e.g. GROUP BY, group by"
                value={acceptableAnswersText}
                onChange={(e) => setAcceptableAnswersText(e.target.value)}
              />
            </label>
          )}

          <label>
            Hint (optional, shown if the student answers incorrectly)
            <input type="text" value={hint} onChange={(e) => setHint(e.target.value)} />
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
            <li key={q.id}>
              {q.prompt}{' '}
              <span className="muted">
                ({q.questionType === 'fill_blank' ? 'fill in the blank' : 'multiple choice'})
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
