// mysqlClient.js
//
// Client for the optional "Live Server (MySQL)" sandbox mode. The browser
// cannot open a raw MySQL TCP connection directly, so this calls a small
// backend proxy (see /mysql-proxy) that holds the teacher-supplied
// host/port/credentials server-side and forwards read-only SELECT queries
// to the real MySQL server.
//
// The proxy's own base URL is configured separately from the target MySQL
// server: VITE_MYSQL_PROXY_URL points at the deployed proxy service
// itself (e.g. a Render web service), while the MySQL host/port/user/
// password are entered by the teacher through the Setup UI and stored
// (client-side, in this starter) so students don't need to type them
// every session -- see MysqlConnectionContext.jsx.

const PROXY_BASE_URL = import.meta.env.VITE_MYSQL_PROXY_URL || ''

export const isMysqlProxyConfigured = Boolean(PROXY_BASE_URL)

// connection: { host, port, user, password, database }
export async function testMysqlConnection(connection) {
  const res = await fetch(`${PROXY_BASE_URL}/api/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connection),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Could not reach that MySQL server.')
  return body
}

// Runs a single SELECT statement against the teacher-configured MySQL
// server through the proxy. The proxy itself re-validates that the query
// is read-only and that the connecting MySQL user has SELECT-only
// privileges -- this client-side check is a first line of defense /
// immediate feedback, not the actual security boundary.
export async function runMysqlQuery(connection, sql) {
  if (!/^\s*select\b/i.test(sql)) {
    throw new Error(
      'This sandbox only runs SELECT queries. The connected server is shared, so writes are blocked both here and on the server itself.'
    )
  }
  const res = await fetch(`${PROXY_BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connection, sql }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Query failed.')
  // Normalize to the same { columns, rows } shape sqliteEngine.js returns,
  // so SandboxPage.jsx can render either backend's result identically.
  const columns = body.fields || (body.rows[0] ? Object.keys(body.rows[0]) : [])
  const rows = body.rows.map((r) => columns.map((c) => r[c]))
  return { columns, rows }
}
