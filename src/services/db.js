import * as SQLite from 'expo-sqlite';

// Opens (or creates) the database file "pos_inventory.db" on the phone.
export const db = SQLite.openDatabaseSync('pos_inventory.db');

export function initDatabase() {
  // WAL = Write-Ahead Logging: faster, safer writes.
  // CREATE TABLE IF NOT EXISTS: builds the table only the first time.
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL
    );
  `);

  // Auto-seed: only insert starter data if the table is empty.
  const countRow = db.getFirstSync('SELECT COUNT(*) as count FROM products;');

  if (countRow.count === 0) {
    const seed = [
      ['Fresh Davao Bananas', 'Produce', 65.0, 48],
      ['Mati Brown Rice (5kg)', 'Grains', 280.0, 25],
      ['Coconut Virgin Oil', 'Beverages', 150.0, 14],
      ['Davao Pomelo', 'Produce', 120.0, 30],
      ['Dried Mango (200g)', 'Snacks', 95.0, 40],
    ];

    // Transaction = all 5 inserts succeed together or none do.
    db.withTransactionSync(() => {
      for (const item of seed) {
        db.runSync(
          'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?);',
          item
        );
      }
    });
  }
}