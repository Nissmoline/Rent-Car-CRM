const { Pool, neonConfig } = require('@neondatabase/serverless');

// Determine if we're running on Vercel or locally
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

let pool;

if (process.env.POSTGRES_URL) {
  // Use Neon PostgreSQL (works both on Vercel and locally)
  if (isVercel) {
    // On Vercel, use WebSocket for Neon
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(process.env.POSTGRES_URL);
    pool = { query: (q, p) => sql(q, p) };
    console.log('Using Neon PostgreSQL (Vercel)');
  } else {
    // Locally, use standard pool
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('Using Neon PostgreSQL (Local)');
  }
} else {
  // Fallback to SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'rentcar.db');

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database (development mode)');
      initializeSQLiteDatabase(db);
    }
  });

  module.exports = { db, type: 'sqlite' };
  return;
}

async function initializePostgresDatabase() {
  try {
    let client;
    if (isVercel) {
      // On Vercel with Neon, use sql directly
      client = pool;
    } else {
      // Locally, get a client from pool
      client = await pool.connect();
    }

    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        license_number VARCHAR(100) UNIQUE NOT NULL,
        address TEXT,
        city VARCHAR(255),
        country VARCHAR(255),
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Vehicles table
      `CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INTEGER NOT NULL,
        color VARCHAR(100),
        license_plate VARCHAR(50) UNIQUE NOT NULL,
        vin VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        transmission VARCHAR(50) NOT NULL,
        fuel_type VARCHAR(50) NOT NULL,
        seats INTEGER NOT NULL,
        daily_rate DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        mileage INTEGER DEFAULT 0,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        pickup_location VARCHAR(255) NOT NULL,
        return_location VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'completed',
        transaction_id VARCHAR(255),
        notes TEXT
      )`,

      // Maintenance table
      `CREATE TABLE IF NOT EXISTS maintenance (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        maintenance_type VARCHAR(255) NOT NULL,
        description TEXT,
        cost DECIMAL(10, 2),
        maintenance_date DATE NOT NULL,
        next_maintenance_date DATE,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id)`,
      `CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance(vehicle_id)`,
      `CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date)`,
      `CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status)`
    ];

    for (const query of queries) {
      // Use pool.query for both Vercel and local
      await client.query(query);
    }

    if (!isVercel && client.release) {
      client.release();
    }

    console.log('PostgreSQL database tables initialized');
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
    throw error;
  }
}

function initializeSQLiteDatabase(db) {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        license_number TEXT UNIQUE NOT NULL,
        address TEXT,
        city TEXT,
        country TEXT,
        date_of_birth DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Vehicles table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        color TEXT,
        license_plate TEXT UNIQUE NOT NULL,
        vin TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        transmission TEXT NOT NULL,
        fuel_type TEXT NOT NULL,
        seats INTEGER NOT NULL,
        daily_rate REAL NOT NULL,
        status TEXT DEFAULT 'available',
        mileage INTEGER DEFAULT 0,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings table
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        pickup_location TEXT NOT NULL,
        return_location TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'completed',
        transaction_id TEXT,
        notes TEXT,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);

    // Maintenance table
    db.run(`
      CREATE TABLE IF NOT EXISTS maintenance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        maintenance_type TEXT NOT NULL,
        description TEXT,
        cost REAL,
        maintenance_date DATE NOT NULL,
        next_maintenance_date DATE,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      )
    `);

    console.log('SQLite database tables initialized');
  });
}

// Initialize database on load
if (pool) {
  console.log('Initializing PostgreSQL database...');
  initializePostgresDatabase()
    .then(() => console.log('PostgreSQL database initialized successfully'))
    .catch(err => console.error('Failed to initialize PostgreSQL database:', err));
}

module.exports = { pool, isVercel, type: 'postgres', initializePostgresDatabase };
