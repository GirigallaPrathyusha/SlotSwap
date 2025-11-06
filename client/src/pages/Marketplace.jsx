import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../state/AuthContext'
import { makeClient } from '../api/client'

export default function Marketplace() {
  const { token } = useAuth()
  const api = useMemo(() => makeClient(() => token), [token])
  const [slots, setSlots] = useState([])
  const [mySwappable, setMySwappable] = useState([])
  const [selectedOffer, setSelectedOffer] = useState(0)
  const [modalSlot, setModalSlot] = useState(null)

  const load = async () => {
    const [{ slots }, { events }] = await Promise.all([
      api.getSwappableSlots(),
      api.getEvents()
    ])
    setSlots(slots)
    setMySwappable(events.filter(e => e.status === 'SWAPPABLE'))
  }

  useEffect(() => { load() }, [])

  const requestSwap = async () => {
    if (!selectedOffer || !modalSlot) return
    await api.createSwapRequest({ mySlotId: selectedOffer, theirSlotId: modalSlot.id })
    setModalSlot(null)
    await load()
  }

  return (
    <div>
      <h2 className="title">Marketplace</h2>
      <p className="muted">Browse others' swappable slots and offer one of yours.</p>
      <table>
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Owner</th>
            <th align="left">Start</th>
            <th align="left">End</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {slots.map(s => (
            <tr key={s.id}>
              <td>{s.title}</td>
              <td>{s.owner_name}</td>
              <td>{new Date(s.start_time).toLocaleString()}</td>
              <td>{new Date(s.end_time).toLocaleString()}</td>
              <td>
                <button onClick={() => { setSelectedOffer(mySwappable[0]?.id || 0); setModalSlot(s) }} disabled={mySwappable.length === 0}>
                  Request Swap
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalSlot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setModalSlot(null)}>
          <div className="card" style={{ maxWidth: 520, margin: '10% auto' }} onClick={e => e.stopPropagation()}>
            <h3>Offer a slot for: {modalSlot.title}</h3>
            {mySwappable.length === 0 ? (
              <p>You have no swappable slots. Mark one of your events as SWAPPABLE first.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <select value={selectedOffer} onChange={e => setSelectedOffer(Number(e.target.value))}>
                  <option value={0}>Select one of your slots</option>
                  {mySwappable.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {new Date(ev.start_time).toLocaleString()}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setModalSlot(null)} className="btn-outline">Cancel</button>
                  <button onClick={requestSwap} disabled={!selectedOffer}>Send Request</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


