// sqliteEngine.js
//
// Thin wrapper around sql.js that loads the bundled Northwind SQLite
// database once and reuses the same in-memory DB instance across the
// session. sql.js runs SQLite compiled to WebAssembly entirely in the
// browser -- no server round trip, no setup required from the student.

import initSqlJs from 'sql.js'

let dbPromise = null

async function loadDb() {
  const SQL = await initSqlJs({
    // Points sql.js at the wasm binary copied into public/ by
    // scripts/copy-sqljs-wasm.mjs (see postinstall in package.json).
    locateFile: () => '/sql-wasm.wasm',
  })
  const response = await fetch('/northwind.sqlite')
  if (!response.ok) {
    throw new Error('Could not load the bundled Northwind SQLite database.')
  }
  const buffer = await response.arrayBuffer()
  return new SQL.Database(new Uint8Array(buffer))
}

// Returns a shared sql.js Database instance, loading it on first call.
export function getSqliteDb() {
  if (!dbPromise) {
    dbPromise = loadDb()
  }
  return dbPromise
}

// Runs a read-only-by-convention query and returns a normalized result:
// { columns: string[], rows: any[][] } for the first statement's result
// set, or null if the statement produced no result set (e.g. an empty
// query). Throws on SQL errors, with sql.js's own message, which is
// usually specific enough for students to self-correct from (e.g. "no
// such column: Pricee").
export async function runSqliteQuery(sql) {
  const db = await getSqliteDb()
  const results = db.exec(sql)
  if (results.length === 0) return null
  const { columns, values } = results[0]
  return { columns, rows: values }
}
