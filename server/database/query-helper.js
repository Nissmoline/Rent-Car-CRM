const { pool, isVercel, type } = require('./db-postgres');
const sqliteDb = require('./db');

/**
 * Universal query function that works with both SQLite and PostgreSQL
 */
async function query(sql, params = []) {
  if (type === 'sqlite') {
    // SQLite - use callback-based API
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  } else {
    // PostgreSQL
    if (isVercel) {
      const { sql: vercelSql } = require('@vercel/postgres');
      // Vercel Postgres uses template literals
      const result = await vercelSql.query(sql, params);
      return result.rows;
    } else {
      const result = await pool.query(sql, params);
      return result.rows;
    }
  }
}

/**
 * Run query (INSERT, UPDATE, DELETE)
 */
async function run(sql, params = []) {
  if (type === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  } else {
    if (isVercel) {
      const { sql: vercelSql } = require('@vercel/postgres');
      const result = await vercelSql.query(sql, params);
      return { lastID: result.rows[0]?.id, rowCount: result.rowCount };
    } else {
      const result = await pool.query(sql, params);
      return { lastID: result.rows[0]?.id, rowCount: result.rowCount };
    }
  }
}

/**
 * Get single row
 */
async function get(sql, params = []) {
  if (type === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  } else {
    if (isVercel) {
      const { sql: vercelSql } = require('@vercel/postgres');
      const result = await vercelSql.query(sql, params);
      return result.rows[0];
    } else {
      const result = await pool.query(sql, params);
      return result.rows[0];
    }
  }
}

/**
 * Convert SQLite query to PostgreSQL format
 * SQLite uses ? placeholders, PostgreSQL uses $1, $2, etc.
 */
function convertQuery(sqliteQuery) {
  if (type === 'sqlite') {
    return sqliteQuery;
  }

  let paramIndex = 1;
  return sqliteQuery.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Get RETURNING clause for INSERT/UPDATE
 * SQLite doesn't support RETURNING, PostgreSQL does
 */
function getReturningClause(columns = '*') {
  if (type === 'postgres') {
    return ` RETURNING ${columns}`;
  }
  return '';
}

/**
 * Get the appropriate AUTOINCREMENT/SERIAL syntax
 */
function getAutoIncrementType() {
  return type === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY';
}

/**
 * Get current timestamp function
 */
function getCurrentTimestamp() {
  return type === 'sqlite' ? 'CURRENT_TIMESTAMP' : 'NOW()';
}

module.exports = {
  query,
  run,
  get,
  convertQuery,
  getReturningClause,
  getAutoIncrementType,
  getCurrentTimestamp,
  dbType: type,
  isVercel
};
