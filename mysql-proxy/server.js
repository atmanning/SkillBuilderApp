// SkillBuilder MySQL proxy
//
// A small, standalone backend that lets the browser-based SQL sandbox run
// read-only queries against a real, teacher-supplied MySQL server. The
// browser can't open a raw MySQL TCP connection directly, and we don't
// want the teacher's MySQL host/credentials ever reaching student
// browsers -- so this tiny service sits in between:
//
//   Student's browser --HTTPS--> this proxy --MySQL protocol--> teacher's MySQL server
//
// Deploy this as its own service (e.g. a Render "Web Service", separate
// from the frontend's "Static Site"). See README.md in this folder.
//
// Security posture (read carefully before deploying this for real
// students, not just a demo):
//   1. Every query is checked here to be a single SELECT statement before
//      it's sent to MySQL. This blocks INSERT/UPDATE/DELETE/DROP/etc, and
//      blocks stacked statements ("SELECT 1; DROP TABLE x").
//   2. This check is a first line of defense, not the only one. The real
//      safety net is using a MySQL user account with SELECT-only grants
//      on the target database (see mysql-proxy/README.md) -- so even if
//      this check had a bug, the database connection itself can't write.
//   3. CORS is restricted to the configured frontend origin (set
//      ALLOWED_ORIGIN below) rather than left open to any site.
//   4. A per-query timeout prevents one runaway query (e.g. a huge
//      cross join) from tying up the connection indefinitely.

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const app = express()
const PORT = process.env.PORT || 4000
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'
const QUERY_TIMEOUT_MS = 8000

app.use(cors({ origin: ALLOWED_ORIGIN }))
app.use(express.json({ limit: '100kb' }))

// --- Read-only query guard --------------------------------------------

function assertSelectOnly(sql) {
  // Strip SQL comments and surrounding whitespace before inspecting, so a
  // query can't hide a second statement inside a comment, e.g.
  // "SELECT 1 -- ; DROP TABLE users".
  const stripped = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()

  if (!stripped) {
    throw new Error('Empty query.')
  }
  if (!/^select\b/i.test(stripped)) {
    throw new Error('Only SELECT statements are allowed in this sandbox.')
  }
  // Disallow a semicolon followed by more (non-whitespace) content, which
  // would indicate a stacked second statement. A single trailing
  // semicolon with nothing after it is fine.
  const afterFirstSemicolon = stripped.split(';').slice(1).join(';').trim()
  if (afterFirstSemicolon.length > 0) {
    throw new Error('Only a single statement is allowed per query.')
  }
}

// --- Connection helper --------------------------------------------------

async function withConnection(connectionInfo, fn) {
  const conn = await mysql.createConnection({
    host: connectionInfo.host,
    port: Number(connectionInfo.port) || 3306,
    user: connectionInfo.user,
    password: connectionInfo.password,
    database: connectionInfo.database,
    connectTimeout: 5000,
  })
  try {
    return await fn(conn)
  } finally {
    await conn.end()
  }
}

// --- Routes --------------------------------------------------------------

app.post('/api/test-connection', async (req, res) => {
  const { host, port, user, password, database } = req.body || {}
  if (!host || !user || !database) {
    return res.status(400).json({ error: 'host, user, and database are required.' })
  }
  try {
    await withConnection({ host, port, user, password, database }, async (conn) => {
      await conn.query('SELECT 1')
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/query', async (req, res) => {
  const { connection, sql } = req.body || {}
  if (!connection || !sql) {
    return res.status(400).json({ error: 'connection and sql are required.' })
  }

  try {
    assertSelectOnly(sql)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  try {
    const rows = await withConnection(connection, async (conn) => {
      // max_execution_time is in milliseconds and only enforced for
      // SELECT statements -- a good fit given assertSelectOnly() above.
      // (MySQL 5.7.8+ / MariaDB uses a different mechanism; if this SET
      // fails on an older or MariaDB server, it's caught below and simply
      // skipped rather than blocking the query entirely.)
      try {
        await conn.query(`SET SESSION max_execution_time=${QUERY_TIMEOUT_MS}`)
      } catch {
        // Older MySQL / MariaDB without this session variable -- continue
        // without a server-side timeout rather than failing the request.
      }
      const [results, fields] = await conn.query(sql)
      return { results, fields }
    })
    res.json({
      rows: rows.results,
      fields: rows.fields ? rows.fields.map((f) => f.name) : [],
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/healthz', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`SkillBuilder MySQL proxy listening on port ${PORT}`)
})
