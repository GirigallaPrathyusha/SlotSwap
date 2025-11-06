const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function eventRoutes(db) {
  const router = express.Router();

  router.use(authMiddleware);

  router.get('/', (req, res) => {
    const events = db
      .prepare('SELECT * FROM events WHERE user_id = ? ORDER BY start_time ASC')
      .all(req.user.id);
    res.json({ events });
  });

  router.post('/', (req, res) => {
    const { title, startTime, endTime, status } = req.body || {};
    if (!title || !startTime || !endTime) return res.status(400).json({ error: 'Missing fields' });
    const st = typeof startTime === 'number' ? startTime : Date.parse(startTime);
    const et = typeof endTime === 'number' ? endTime : Date.parse(endTime);
    if (!Number.isFinite(st) || !Number.isFinite(et)) return res.status(400).json({ error: 'Invalid timestamps' });
    const finalStatus = status || 'BUSY';
    const info = db
      .prepare('INSERT INTO events (user_id, title, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, title, st, et, finalStatus);
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ event });
  });

  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    const { title, startTime, endTime, status } = req.body || {};
    const event = db.prepare('SELECT * FROM events WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const newTitle = title ?? event.title;
    const newStart = startTime != null ? (typeof startTime === 'number' ? startTime : Date.parse(startTime)) : event.start_time;
    const newEnd = endTime != null ? (typeof endTime === 'number' ? endTime : Date.parse(endTime)) : event.end_time;
    const newStatus = status ?? event.status;

    db.prepare('UPDATE events SET title = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?')
      .run(newTitle, newStart, newEnd, newStatus, id);
    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json({ event: updated });
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    const event = db.prepare('SELECT * FROM events WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const tx = db.transaction(() => {
      // If there are pending requests involving this event, revert the counterpart to SWAPPABLE
      const pendingsAsMine = db.prepare("SELECT * FROM swap_requests WHERE my_slot_id = ? AND status = 'PENDING'").all(id);
      for (const r of pendingsAsMine) {
        db.prepare("UPDATE events SET status = 'SWAPPABLE' WHERE id = ? AND status = 'SWAP_PENDING'").run(r.their_slot_id);
      }
      const pendingsAsTheirs = db.prepare("SELECT * FROM swap_requests WHERE their_slot_id = ? AND status = 'PENDING'").all(id);
      for (const r of pendingsAsTheirs) {
        db.prepare("UPDATE events SET status = 'SWAPPABLE' WHERE id = ? AND status = 'SWAP_PENDING'").run(r.my_slot_id);
      }

      // Remove any swap requests referencing this event to satisfy FK constraints
      db.prepare('DELETE FROM swap_requests WHERE my_slot_id = ? OR their_slot_id = ?').run(id, id);
      db.prepare('DELETE FROM events WHERE id = ?').run(id);
    });
    tx();
    res.status(204).send();
  });

  return router;
};


