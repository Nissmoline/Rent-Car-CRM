/**
 * Universal Database Adapter
 * Provides a consistent API for both SQLite and PostgreSQL
 */

// Determine which database to use
const usePostgres = process.env.POSTGRES_URL || process.env.NODE_ENV === 'production';

let dbAdapter;
let queryConverter;

if (usePostgres) {
  // PostgreSQL setup
  const { pool } = require('./db-postgres');

  dbAdapter = {
    /**
     * Run INSERT/UPDATE/DELETE query
     */
    async run(query, params = []) {
      try {
        const result = await pool.query(query, params);
        return {
          lastID: result.rows[0]?.id,
          rowCount: result.rowCount,
          rows: result.rows
        };
      } catch (error) {
        console.error('Database run error:', error);
        throw error;
      }
    },

    /**
     * Get single row
     */
    async get(query, params = []) {
      try {
        const result = await pool.query(query, params);
        return result.rows[0];
      } catch (error) {
        console.error('Database get error:', error);
        throw error;
      }
    },

    /**
     * Get all rows
     */
    async all(query, params = []) {
      try {
        const result = await pool.query(query, params);
        return result.rows;
      } catch (error) {
        console.error('Database all error:', error);
        throw error;
      }
    }
  };

  // PostgreSQL uses $1, $2, etc.
  queryConverter = {
    convertParams(query) {
      let paramIndex = 1;
      return query.replace(/\?/g, () => `$${paramIndex++}`);
    }
  };

} else {
  // SQLite setup
  const db = require('./db');

  dbAdapter = {
    run: (query, params = []) => new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          console.error('SQLite run error:', err);
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes, rowCount: this.changes });
        }
      });
    }),

    get: (query, params = []) => new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) {
          console.error('SQLite get error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    }),

    all: (query, params = []) => new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error('SQLite all error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    })
  };

  // SQLite uses ?
  queryConverter = {
    convertParams(query) {
      return query; // No conversion needed
    }
  };
}

/**
 * Smart query function that automatically converts ? to $1, $2 for PostgreSQL
 */
function query(sqlQuery, params = []) {
  const convertedQuery = usePostgres ? queryConverter.convertParams(sqlQuery) : sqlQuery;
  return dbAdapter.all(convertedQuery, params);
}

function queryOne(sqlQuery, params = []) {
  const convertedQuery = usePostgres ? queryConverter.convertParams(sqlQuery) : sqlQuery;
  return dbAdapter.get(convertedQuery, params);
}

function execute(sqlQuery, params = []) {
  const convertedQuery = usePostgres ? queryConverter.convertParams(sqlQuery) : sqlQuery;
  return dbAdapter.run(convertedQuery, params);
}

module.exports = {
  db: dbAdapter,
  query,        // Get all rows with auto param conversion
  queryOne,     // Get single row with auto param conversion
  execute,      // Run INSERT/UPDATE/DELETE with auto param conversion
  usePostgres,
  raw: dbAdapter // Access raw db adapter without conversion
};
