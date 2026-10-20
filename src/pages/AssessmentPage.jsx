import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { assessmentQuestions, recommendTier } from '../data/sampleCourse'

export default function AssessmentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [tier, setTier] = useState(null)

  function selectAnswer(questionId, choiceIndex) {
    setAnswers((a) => ({ ...a, [questionId]: choiceIndex }))
  }

  function handleSubmit() {
    const results = assessmentQuestions.map((q) => ({
      difficulty: q.difficulty,
      correct: answers[q.id] === q.correctIndex,
    }))
    const recommended = recommendTier(results)
    localStorage.setItem(`recommendedTier:${user.id}`, recommended)
    setTier(recommended)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="page-centered">
        <div className="card">
          <h1>Assessment complete</h1>
          <p>
            Based on your answers, you're starting at the <strong>{tier}</strong> level.
          </p>
          <button onClick={() => navigate('/student')}>Go to my lessons</button>
        </div>
      </div>
    )
  }

  const allAnswered = assessmentQuestions.every((q) => answers[q.id] !== undefined)

  return (
    <div className="page">
      <h1>Skill assessment</h1>
      <p className="muted">
        This placeholder assessment uses a handful of sample questions across difficulty
        tiers. In the full course this would be a longer, adaptive set.
      </p>
      {assessmentQuestions.map((q, qi) => (
        <section className="card" key={q.id}>
          <h3>
            {qi + 1}. {q.prompt}
          </h3>
          {q.choices.map((c, ci) => (
            <label key={ci} className="choice-row">
              <input
                type="radio"
                name={q.id}
                checked={answers[q.id] === ci}
                onChange={() => selectAnswer(q.id, ci)}
              />
              {c}
            </label>
          ))}
        </section>
      ))}
      <button disabled={!allAnswered} onClick={handleSubmit}>
        Submit assessment
      </button>
    </div>
  )
}
