import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMysqlConnection } from '../context/MysqlConnectionContext'
import { testMysqlConnection, isMysqlProxyConfigured } from '../lib/mysqlClient'

// Teacher-facing setup screen for the optional "Live Server (MySQL)"
// sandbox mode. Entering connection details here (rather than per-student)
// matches how this was scoped: one shared classroom MySQL server,
// configured once.
export default function MysqlSetupPage() {
  const { connection, setConnection, clearConnection } = useMysqlConnection()
  const [form, setForm] = useState(
    connection || { host: '', port: '3306', user: '', password: '', database: 'northwind' }
  )
  const [status, setStatus] = useState('')
  const [testing, setTesting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleTest(e) {
    e.preventDefault()
    setStatus('')
    setTesting(true)
    try {
      await testMysqlConnection(form)
      setStatus('Connection successful.')
      setConnection(form)
    } catch (err) {
      setStatus(`Connection failed: ${err.message}`)
    } finally {
      setTesting(false)
    }
  }

  if (!isMysqlProxyConfigured) {
    return (
      <div className="page">
        <Link to="/teacher" className="btn-link">
          &larr; Back to dashboard
        </Link>
        <h1>Live Server (MySQL) setup</h1>
        <section className="card">
          <p>
            This feature requires a small proxy service to be deployed and its URL set as{' '}
            <code>VITE_MYSQL_PROXY_URL</code> in this app's environment. See{' '}
            <code>mysql-proxy/README.md</code> in the repository for deployment
            instructions (it's a small Node/Express service, deployable to Render as a
            free web service).
          </p>
          <p className="muted">
            Until then, students can still use the bundled SQLite sandbox with no setup
            required.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/teacher" className="btn-link">
        &larr; Back to dashboard
      </Link>
      <h1>Live Server (MySQL) setup</h1>
      <section className="card">
        <p className="muted">
          Connect the sandbox to a real MySQL server. Students will run SELECT-only
          queries against it through a small proxy service (your credentials are sent to
          that proxy, never exposed in the student's browser). Import{' '}
          <code>mysql-proxy/northwind_mysql_import.sql</code> into this database first so
          the schema matches the sandbox challenges.
        </p>
        <form onSubmit={handleTest} className="stacked-form">
          <label>
            Host / IP address
            <input
              type="text"
              required
              placeholder="172.16.1.45"
              value={form.host}
              onChange={(e) => update('host', e.target.value)}
            />
          </label>
          <label>
            Port
            <input
              type="text"
              required
              value={form.port}
              onChange={(e) => update('port', e.target.value)}
            />
          </label>
          <label>
            Database name
            <input
              type="text"
              required
              value={form.database}
              onChange={(e) => update('database', e.target.value)}
            />
          </label>
          <label>
            Username
            <input
              type="text"
              required
              value={form.user}
              onChange={(e) => update('user', e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </label>
          <button type="submit" disabled={testing}>
            {testing ? 'Testing...' : 'Test & save connection'}
          </button>
        </form>
        {status && <p className="hint-text">{status}</p>}

        {connection && (
          <div style={{ marginTop: '1rem' }}>
            <p className="muted">
              Currently connected: {connection.user}@{connection.host}:{connection.port}/
              {connection.database}
            </p>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                clearConnection()
                setStatus('Connection cleared. Students will use SQLite until reconfigured.')
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Security notes</h2>
        <ul>
          <li>
            Use a MySQL account with <strong>SELECT-only</strong> privileges on this
            database for the sandbox -- not root, and not a write-capable account. The
            proxy also blocks non-SELECT statements server-side, but a least-privilege
            account is the real safety net.
          </li>
          <li>
            This starter stores the connection in this browser's local storage. See the
            comment in <code>src/context/MysqlConnectionContext.jsx</code> for how to
            move this server-side for a real classroom deployment.
          </li>
        </ul>
      </section>
    </div>
  )
}
