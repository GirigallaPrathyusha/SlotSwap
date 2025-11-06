import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { makeClient } from '../api/client'

export default function Dashboard() {
  const { token } = useAuth()
  const api = useMemo(() => makeClient(() => token), [token])
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { events } = await api.getEvents()
      setEvents(events)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.createEvent({ title, startTime: Date.parse(start), endTime: Date.parse(end), status: 'BUSY' })
      setTitle(''); setStart(''); setEnd('')
      await load()
    } catch (e) { setError(e.message) }
  }

  const toggleSwappable = async (ev) => {
    const next = ev.status === 'SWAPPABLE' ? 'BUSY' : 'SWAPPABLE'
    await api.updateEvent(ev.id, { status: next })
    await load()
  }

  const remove = async (ev) => {
    await api.deleteEvent(ev.id)
    await load()
  }

  return (
    <div>
      <h2 className="title">My Events</h2>
      <form onSubmit={create} style={{ display: 'grid', gap: 10, maxWidth: 620, marginBottom: 16 }}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
        <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button type="submit">Create Event</button>
      </form>
      {loading ? <div>Loading...</div> : (
        <table>
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Start</th>
              <th align="left">End</th>
              <th align="left">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id}>
                <td>{ev.title}</td>
                <td>{new Date(ev.start_time).toLocaleString()}</td>
                <td>{new Date(ev.end_time).toLocaleString()}</td>
                <td>
                  {ev.status === 'BUSY' && <span className="badge busy">BUSY</span>}
                  {ev.status === 'SWAPPABLE' && <span className="badge swappable">SWAPPABLE</span>}
                  {ev.status === 'SWAP_PENDING' && <span className="badge pending">SWAP PENDING</span>}
                </td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleSwappable(ev)} disabled={ev.status === 'SWAP_PENDING'}>
                    {ev.status === 'SWAPPABLE' ? 'Make Busy' : 'Make Swappable'}
                  </button>
                  <button onClick={() => remove(ev)} disabled={ev.status === 'SWAP_PENDING'}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


