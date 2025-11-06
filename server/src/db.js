const Database = require('better-sqlite3');

function initDatabase() {
  const db = new Database(process.env.DB_FILE || 'slotswapper.db');

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('BUSY','SWAPPABLE','SWAP_PENDING')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS swap_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_user_id INTEGER NOT NULL,
      responder_user_id INTEGER NOT NULL,
      my_slot_id INTEGER NOT NULL,
      their_slot_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING','ACCEPTED','REJECTED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(requester_user_id) REFERENCES users(id),
      FOREIGN KEY(responder_user_id) REFERENCES users(id),
      FOREIGN KEY(my_slot_id) REFERENCES events(id),
      FOREIGN KEY(their_slot_id) REFERENCES events(id)
    );
  `);

  return db;
}

module.exports = { initDatabase };


