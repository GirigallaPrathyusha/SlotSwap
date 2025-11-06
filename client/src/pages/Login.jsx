import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { makeClient } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, token } = useAuth()
  const api = makeClient(() => token)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { token: t, user } = await api.login({ email, password })
      login(t, user)
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h2 className="title">Log In</h2>
      <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>Welcome back 👋</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button type="submit">Log In</button>
      </form>
      <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </div>
  )
}


