import { createContext, useContext, useEffect, useState } from 'react'

const MysqlConnectionContext = createContext(null)
const STORAGE_KEY = 'sb_mysql_connection'

// Holds the teacher-entered MySQL connection info (host, port, user,
// password, database) for the "Live Server" sandbox mode, shared by any
// page that needs it. Stored in localStorage for this starter so a
// teacher doesn't have to re-type it every session.
//
// SECURITY NOTE for whoever maintains this: storing the MySQL password in
// the browser's localStorage means any student using that same browser
// profile could read it from devtools. For a classroom deployment where
// students connect from their own devices to a shared backend, move this
// to a server-side setting instead (e.g. a Supabase table scoped to the
// teacher's account, or an environment variable on the mysql-proxy
// service) rather than client-side storage. This starter keeps it
// client-side only to keep the first working version simple.
export function MysqlConnectionProvider({ children }) {
  const [connection, setConnectionState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (connection) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connection))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [connection])

  function setConnection(next) {
    setConnectionState(next)
  }

  function clearConnection() {
    setConnectionState(null)
  }

  return (
    <MysqlConnectionContext.Provider value={{ connection, setConnection, clearConnection }}>
      {children}
    </MysqlConnectionContext.Provider>
  )
}

export function useMysqlConnection() {
  const ctx = useContext(MysqlConnectionContext)
  if (!ctx) throw new Error('useMysqlConnection must be used within a MysqlConnectionProvider')
  return ctx
}
