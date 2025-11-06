import { apiBaseUrl } from './config'

export function makeClient(getToken) {
  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')
    const token = getToken?.()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
    if (!res.ok) {
      let err
      try { err = await res.json() } catch { err = { error: res.statusText } }
      throw new Error(err.error || 'Request failed')
    }
    return res.status === 204 ? null : res.json()
  }

  return {
    signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    getEvents: () => request('/events'),
    createEvent: (body) => request('/events', { method: 'POST', body: JSON.stringify(body) }),
    updateEvent: (id, body) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

    getSwappableSlots: () => request('/swappable-slots'),
    createSwapRequest: (body) => request('/swap-request', { method: 'POST', body: JSON.stringify(body) }),
    respondSwap: (id, accept) => request(`/swap-response/${id}`, { method: 'POST', body: JSON.stringify({ accept }) }),
    getIncoming: () => request('/requests/incoming'),
    getOutgoing: () => request('/requests/outgoing')
  }
}


