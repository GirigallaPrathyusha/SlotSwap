import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { makeClient } from '../api/client'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, token } = useAuth()
  const api = makeClient(() => token)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { token: t, user } = await api.signup({ name, email, password })
      login(t, user)
      navigate('/')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h2 className="title">Sign Up</h2>
      <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>Create an account to swap smarter ✨</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button type="submit">Create Account</button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  )
}


