import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as dataService from '../lib/dataService'
import { lessons } from '../data/sampleCourse'

export default function LessonPage() {
  const { lessonId } = useParams()
  const { user } = useAuth()
  const lesson = lessons.find((l) => l.id === lessonId)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    dataService.getQuestionsForLesson(lessonId).then(setQuestions)
  }, [lessonId])

  function selectAnswer(questionId, choiceIndex) {
    setAnswers((a) => ({ ...a, [questionId]: choiceIndex }))
  }

  async function handleSubmit() {
    const correctCount = questions.filter(
      (q) => answers[q.id] === q.correctIndex
    ).length
    await dataService.recordLessonResult({
      studentId: user.id,
      lessonId,
      correctCount,
      totalCount: questions.length,
    })
    setResult({ correctCount, totalCount: questions.length })
    setSubmitted(true)
  }

  if (!lesson) return <p>Lesson not found.</p>

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
        <h2>Practice quiz</h2>
        {!submitted &&
          questions.map((q, qi) => (
            <div key={q.id} className="quiz-question">
              <p>
                <strong>
                  {qi + 1}. {q.prompt}
                </strong>
              </p>
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
            </div>
          ))}

        {!submitted && questions.length > 0 && (
          <button
            disabled={questions.some((q) => answers[q.id] === undefined)}
            onClick={handleSubmit}
          >
            Submit answers
          </button>
        )}

        {submitted && result && (
          <div>
            <p>
              You scored {result.correctCount} / {result.totalCount}
              {result.correctCount / result.totalCount >= 0.8
                ? ' — lesson mastered!'
                : ' — consider reviewing and retrying.'}
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
