import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMysqlConnection } from '../context/MysqlConnectionContext'
import { runSqliteQuery } from '../lib/sqliteEngine'
import { runMysqlQuery, isMysqlProxyConfigured } from '../lib/mysqlClient'
import { checkChallenge } from '../lib/sandboxChecker'
import * as dataService from '../lib/dataService'
import { sandboxChallenges, getReferenceQuery, getStarterQuery } from '../data/sandboxChallenges'
import ResultTable from '../components/ResultTable'

const TIER_ORDER = ['basic', 'intermediate', 'advanced']

export default function SandboxPage() {
  const { challengeId } = useParams()
  const { user } = useAuth()
  const { connection } = useMysqlConnection()

  // "sqlite" (bundled, zero setup) or "mysql" (teacher-configured live
  // server). Defaults to mysql only if a connection has actually been
  // saved by the teacher; otherwise sqlite, so students are never stuck
  // staring at a broken default.
  const [engine, setEngine] = useState(connection ? 'mysql' : 'sqlite')

  const challenge = sandboxChallenges.find((c) => c.id === challengeId) || sandboxChallenges[0]

  const [query, setQuery] = useState(getStarterQuery(challenge, engine))
  const [runResult, setRunResult] = useState(null)
  const [runError, setRunError] = useState(null)
  const [checkResult, setCheckResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    setQuery(getStarterQuery(challenge, engine))
    setRunResult(null)
    setRunError(null)
    setCheckResult(null)
    setShowHint(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, engine])

  async function runQuery(sql) {
    if (engine === 'mysql') {
      if (!connection) throw new Error('No MySQL connection configured. Ask your teacher to set one up.')
      return runMysqlQuery(connection, sql)
    }
    return runSqliteQuery(sql)
  }

  async function handleRun() {
    setBusy(true)
    setRunError(null)
    setCheckResult(null)
    try {
      const result = await runQuery(query)
      setRunResult(result)
    } catch (err) {
      setRunError(err.message)
      setRunResult(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleCheck() {
    setBusy(true)
    setCheckResult(null)
    const referenceQuery = getReferenceQuery(challenge, engine)
    const result = await checkChallenge({
      studentQuery: query,
      referenceQuery,
      orderMatters: challenge.orderMatters,
      runQueryFn: runQuery,
    })
    setCheckResult(result)
    setRunResult(result.studentResult)
    setRunError(result.error)
    setBusy(false)

    if (result.passed) {
      await dataService.recordLessonResult({
        studentId: user.id,
        lessonId: `sandbox-${challenge.id}`,
        correctCount: 1,
        totalCount: 1,
      })
    }
  }

  return (
    <div className="page page-wide">
      <Link to="/student" className="btn-link">
        &larr; Back to my lessons
      </Link>
      <h1>Practice sandbox</h1>

      <section className="card">
        <div className="sandbox-tabs">
          <button
            className={engine === 'sqlite' ? 'tab-active' : 'tab'}
            onClick={() => setEngine('sqlite')}
          >
            Practice (SQLite, no setup)
          </button>
          <button
            className={engine === 'mysql' ? 'tab-active' : 'tab'}
            onClick={() => setEngine('mysql')}
            disabled={!isMysqlProxyConfigured}
            title={!isMysqlProxyConfigured ? 'Live MySQL mode is not configured for this deployment yet.' : ''}
          >
            Live Server (MySQL)
          </button>
        </div>
        {engine === 'mysql' && !connection && (
          <p className="hint-text">
            No MySQL server is connected yet. A teacher can set one up from the Teacher
            Dashboard.
          </p>
        )}
        {engine === 'mysql' && connection && (
          <p className="muted">
            Connected to {connection.host}:{connection.port}/{connection.database}{' '}
            (read-only)
          </p>
        )}
      </section>

      <div className="sandbox-layout">
        <nav className="card sandbox-nav">
          <h3>Challenges</h3>
          {TIER_ORDER.map((tier) => (
            <div key={tier}>
              <p className="tier-label">{tier}</p>
              <ul className="plain-list">
                {sandboxChallenges
                  .filter((c) => c.tier === tier)
                  .map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/sandbox/${c.id}`}
                        className={c.id === challenge.id ? 'nav-active' : ''}
                      >
                        {c.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        <section className="card sandbox-main">
          <h2>{challenge.title}</h2>
          <p>{challenge.prompt}</p>

          <textarea
            className="sql-editor"
            rows={8}
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="sandbox-actions">
            <button onClick={handleRun} disabled={busy}>
              Run query
            </button>
            <button onClick={handleCheck} disabled={busy}>
              Check my answer
            </button>
            <button className="btn-link" onClick={() => setShowHint((h) => !h)}>
              {showHint ? 'Hide hint' : 'Show hint'}
            </button>
          </div>

          {showHint && <p className="hint-text">{challenge.hint}</p>}

          {runError && <p className="error-text">{runError}</p>}

          {checkResult && (
            <p className={checkResult.passed ? 'hint-text' : 'error-text'}>
              {checkResult.passed
                ? 'Correct! Your query returned the expected results.'
                : 'Not quite -- your result set doesn\'t match what\'s expected yet. Compare row counts and columns below.'}
            </p>
          )}

          {runResult && (
            <div>
              <h3>Result</h3>
              <ResultTable result={runResult} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
