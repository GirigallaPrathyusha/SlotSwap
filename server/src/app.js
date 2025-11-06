const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const swapRoutes = require('./routes/swaps');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
const db = initDatabase();
app.set('db', db);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'slotswapper-server' });
});

app.use('/api/auth', authRoutes(db));
app.use('/api/events', eventRoutes(db));
app.use('/api', swapRoutes(db));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`SlotSwapper server running on http://localhost:${PORT}`);
});


