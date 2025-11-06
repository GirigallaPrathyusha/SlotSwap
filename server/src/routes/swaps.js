const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = function swapRoutes(db) {
  const router = express.Router();

  router.use(authMiddleware);

  // GET /api/swappable-slots – all others' swappable events
  router.get('/swappable-slots', (req, res) => {
    const slots = db
      .prepare(
        `SELECT e.*, u.name AS owner_name, u.email AS owner_email
         FROM events e
         JOIN users u ON u.id = e.user_id
         WHERE e.status = 'SWAPPABLE' AND e.user_id <> ?
         ORDER BY e.start_time ASC`
      )
      .all(req.user.id);
    res.json({ slots });
  });

  // POST /api/swap-request
  router.post('/swap-request', (req, res) => {
    const { mySlotId, theirSlotId } = req.body || {};
    if (!mySlotId || !theirSlotId) return res.status(400).json({ error: 'Missing slot IDs' });

    const mySlot = db
      .prepare("SELECT * FROM events WHERE id = ? AND user_id = ?")
      .get(mySlotId, req.user.id);
    if (!mySlot) return res.status(404).json({ error: 'My slot not found' });
    if (mySlot.status !== 'SWAPPABLE') return res.status(400).json({ error: 'My slot not swappable' });

    const theirSlot = db.prepare('SELECT * FROM events WHERE id = ?').get(theirSlotId);
    if (!theirSlot) return res.status(404).json({ error: 'Their slot not found' });
    if (theirSlot.user_id === req.user.id) return res.status(400).json({ error: 'Cannot request your own slot' });
    if (theirSlot.status !== 'SWAPPABLE') return res.status(400).json({ error: 'Their slot not swappable' });

    const responderUserId = theirSlot.user_id;

    const tx = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO swap_requests (requester_user_id, responder_user_id, my_slot_id, their_slot_id, status)
           VALUES (?, ?, ?, ?, 'PENDING')`
        )
        .run(req.user.id, responderUserId, mySlotId, theirSlotId);

      db.prepare("UPDATE events SET status = 'SWAP_PENDING' WHERE id IN (?, ?) AND status = 'SWAPPABLE'")
        .run(mySlotId, theirSlotId);

      return info.lastInsertRowid;
    });

    const requestId = tx();
    const request = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(requestId);
    res.status(201).json({ request });
  });

  // POST /api/swap-response/:id
  router.post('/swap-response/:id', (req, res) => {
    const id = Number(req.params.id);
    const { accept } = req.body || {};

    const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id);
    if (!swap) return res.status(404).json({ error: 'Swap request not found' });
    if (swap.status !== 'PENDING') return res.status(400).json({ error: 'Swap request already handled' });
    if (swap.responder_user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to respond to this request' });

    if (accept === false) {
      const txReject = db.transaction(() => {
        db.prepare("UPDATE swap_requests SET status = 'REJECTED' WHERE id = ?").run(id);
        db.prepare("UPDATE events SET status = 'SWAPPABLE' WHERE id IN (?, ?) AND status = 'SWAP_PENDING'")
          .run(swap.my_slot_id, swap.their_slot_id);
      });
      txReject();
      const updated = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id);
      return res.json({ request: updated });
    }

    const txAccept = db.transaction(() => {
      // Verify both slots still exist and are SWAP_PENDING
      const mySlot = db.prepare('SELECT * FROM events WHERE id = ?').get(swap.my_slot_id);
      const theirSlot = db.prepare('SELECT * FROM events WHERE id = ?').get(swap.their_slot_id);
      if (!mySlot || !theirSlot) throw new Error('Slots missing');
      if (mySlot.status !== 'SWAP_PENDING' || theirSlot.status !== 'SWAP_PENDING') throw new Error('Slots not pending');

      // Ensure ownership hasn't changed (defensive checks)
      if (mySlot.user_id !== swap.requester_user_id || theirSlot.user_id !== swap.responder_user_id) {
        throw new Error('Ownership mismatch');
      }

      // Exchange owners
      db.prepare('UPDATE events SET user_id = ?, status = \"BUSY\" WHERE id = ?')
        .run(theirSlot.user_id, mySlot.id);
      db.prepare('UPDATE events SET user_id = ?, status = \"BUSY\" WHERE id = ?')
        .run(mySlot.user_id, theirSlot.id);

      // Mark request accepted
      db.prepare("UPDATE swap_requests SET status = 'ACCEPTED' WHERE id = ?").run(id);
    });

    try {
      txAccept();
    } catch (e) {
      return res.status(409).json({ error: e.message || 'Swap could not be completed' });
    }

    const updated = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id);
    return res.json({ request: updated });
  });

  // Extras: incoming/outgoing lists
  router.get('/requests/incoming', (req, res) => {
    const items = db
      .prepare(
        `SELECT r.*, e1.title AS my_title, e2.title AS their_title
         FROM swap_requests r
         JOIN events e1 ON e1.id = r.their_slot_id
         JOIN events e2 ON e2.id = r.my_slot_id
         WHERE r.responder_user_id = ?
         ORDER BY r.created_at DESC`
      )
      .all(req.user.id);
    res.json({ requests: items });
  });

  router.get('/requests/outgoing', (req, res) => {
    const items = db
      .prepare(
        `SELECT r.*, e1.title AS my_title, e2.title AS their_title
         FROM swap_requests r
         JOIN events e1 ON e1.id = r.my_slot_id
         JOIN events e2 ON e2.id = r.their_slot_id
         WHERE r.requester_user_id = ?
         ORDER BY r.created_at DESC`
      )
      .all(req.user.id);
    res.json({ requests: items });
  });

  return router;
};


