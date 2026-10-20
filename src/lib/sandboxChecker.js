// sandboxChecker.js
//
// Runs a student's query and a challenge's hidden reference query against
// the same backend, then compares the RESULT SETS rather than the query
// text. This is what lets equivalent queries (different column aliases,
// different join syntax, different but equivalent WHERE ordering) all be
// accepted, while a genuinely wrong answer still fails.

function normalizeRow(row) {
  // Normalizes values for comparison: numbers-as-strings and real numbers
  // compare equal (SQLite and MySQL sometimes return numeric types
  // differently), and everything is stringified so [1, '1'] and [1, 1]
  // both normalize to the same thing.
  return row.map((v) => {
    if (v === null || v === undefined) return 'NULL'
    if (typeof v === 'number') return String(v)
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
      return String(Number(v))
    }
    return String(v)
  })
}

function resultsMatch(a, b, orderMatters) {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.rows.length !== b.rows.length) return false

  const normalizedA = a.rows.map(normalizeRow)
  const normalizedB = b.rows.map(normalizeRow)

  if (orderMatters) {
    return normalizedA.every((row, i) => JSON.stringify(row) === JSON.stringify(normalizedB[i]))
  }

  // Order doesn't matter: sort both row sets into a canonical order before
  // comparing, so the student doesn't need to guess the reference query's
  // exact ORDER BY.
  const sortedA = normalizedA.map((r) => JSON.stringify(r)).sort()
  const sortedB = normalizedB.map((r) => JSON.stringify(r)).sort()
  return sortedA.every((row, i) => row === sortedB[i])
}

// runQueryFn: async (sql) => { columns, rows } | null -- pass in either
// runSqliteQuery or a (connection, sql) => runMysqlQuery(connection, sql)
// partial, so this checker stays backend-agnostic.
export async function checkChallenge({ studentQuery, referenceQuery, orderMatters, runQueryFn }) {
  let studentResult
  try {
    studentResult = await runQueryFn(studentQuery)
  } catch (err) {
    return { passed: false, error: err.message, studentResult: null, referenceResult: null }
  }

  const referenceResult = await runQueryFn(referenceQuery)
  const passed = resultsMatch(studentResult, referenceResult, orderMatters)

  return { passed, error: null, studentResult, referenceResult }
}
