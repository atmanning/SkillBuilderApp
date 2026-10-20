import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { MysqlConnectionProvider } from './context/MysqlConnectionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MysqlConnectionProvider>
          <App />
        </MysqlConnectionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
