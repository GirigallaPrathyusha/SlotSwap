# SlotSwapper

Peer-to-peer time-slot swapping app.

## Tech Stack
- Backend: Node.js (Express) + SQLite (better-sqlite3), JWT auth
- Frontend: React + Vite + react-router

## Local Setup

### Prereqs
- Node 18+

### Backend
```bash
cd server
copy .env.example .env  # Windows PowerShell: cp .env.example .env also works
npm install
npm run dev  # or npm start
```
Defaults:
- PORT: 4000
- DB file: slotswapper.db

### Frontend
```bash
cd client
npm install
npm run dev
```
The frontend expects the API at `http://localhost:4000/api`. To change this, set `VITE_API_URL` in `client/.env`.

## API Overview
- POST /api/auth/signup { name, email, password }
- POST /api/auth/login { email, password }
- GET /api/events
- POST /api/events { title, startTime, endTime, status? }
- PUT /api/events/:id { title?, startTime?, endTime?, status? }
- DELETE /api/events/:id
- GET /api/swappable-slots
- POST /api/swap-request { mySlotId, theirSlotId }
- POST /api/swap-response/:id { accept: boolean }
- GET /api/requests/incoming
- GET /api/requests/outgoing

Send the JWT token as `Authorization: Bearer <token>` for protected endpoints.

## Optional: Docker Compose
```bash
docker compose up --build
```
- Client: http://localhost:5173
- Server: http://localhost:4000

## Notes
- Swap accept is transactional: both slots must be SWAP_PENDING; on accept, owners are exchanged and both become BUSY.
- Reject reverts both slots to SWAPPABLE.


