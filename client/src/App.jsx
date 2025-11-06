import { Routes, Route, Link, Navigate, useLocation, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import Requests from './pages/Requests'
import { useAuth } from './state/AuthContext'

function Protected({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export default function App() {
  const { token, user, logout } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    const root = document.documentElement
    if (dark) { root.classList.add('dark'); localStorage.setItem('theme','dark') }
    else { root.classList.remove('dark'); localStorage.setItem('theme','light') }
  }, [dark])
  return (
    <div className="container">
      <header className="navbar">
        <h1 className="navbar-title" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>SlotSwapper</h1>
        <nav>
          <NavLink to="/" end className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Dashboard</NavLink>
          <NavLink to="/marketplace" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Marketplace</NavLink>
          <NavLink to="/requests" className={({isActive}) => 'nav-link' + (isActive ? ' active' : '')}>Requests</NavLink>
        </nav>
        <div className="theme-toggle" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-outline" onClick={() => setDark(d => !d)}>{dark ? 'Light' : 'Dark'}</button>
          {token ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{user?.name}</span>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/signup" className="nav-link">Sign Up</Link>
            </div>
          )}
        </div>
      </header>
      <div className="card">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/marketplace" element={<Protected><Marketplace /></Protected>} />
          <Route path="/requests" element={<Protected><Requests /></Protected>} />
        </Routes>
      </div>
    </div>
  )}


