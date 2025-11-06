import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { makeClient } from '../api/client'

export default function Requests() {
  const { token } = useAuth()
  const api = useMemo(() => makeClient(() => token), [token])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])

  const load = async () => {
    const [{ requests: inc }, { requests: out }] = await Promise.all([
      api.getIncoming(),
      api.getOutgoing()
    ])
    setIncoming(inc)
    setOutgoing(out)
  }

  useEffect(() => { load() }, [])

  const respond = async (id, accept) => {
    await api.respondSwap(id, accept)
    await load()
  }

  return (
    <div>
      <h2 className="title">Requests</h2>
      <div className="grid-two">
        <section>
          <h3>Incoming</h3>
          <table>
            <thead>
              <tr>
                <th align="left">Their offer</th>
                <th align="left">For your</th>
                <th align="left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {incoming.map(r => (
                <tr key={r.id}>
                  <td>{r.their_title || r.my_title}</td>
                  <td>{r.my_title || r.their_title}</td>
                  <td>
                    {r.status === 'PENDING' && <span className="badge pending">PENDING</span>}
                    {r.status === 'ACCEPTED' && <span className="badge swappable">ACCEPTED</span>}
                    {r.status === 'REJECTED' && <span className="badge busy">REJECTED</span>}
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {r.status === 'PENDING' && (
                      <>
                        <button onClick={() => respond(r.id, true)}>Accept</button>
                        <button className="btn-outline" onClick={() => respond(r.id, false)}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h3>Outgoing</h3>
          <table>
            <thead>
              <tr>
                <th align="left">You offered</th>
                <th align="left">For</th>
                <th align="left">Status</th>
              </tr>
            </thead>
            <tbody>
              {outgoing.map(r => (
                <tr key={r.id}>
                  <td>{r.my_title}</td>
                  <td>{r.their_title}</td>
                  <td>
                    {r.status === 'PENDING' && <span className="badge pending">PENDING</span>}
                    {r.status === 'ACCEPTED' && <span className="badge swappable">ACCEPTED</span>}
                    {r.status === 'REJECTED' && <span className="badge busy">REJECTED</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}


