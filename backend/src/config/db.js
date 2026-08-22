const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = drizzle(pool);

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to Render PostgreSQL database:', err.message);
  } else {
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        console.error('Database connection test query failed:', err.message);
      } else {
        console.log('Successfully connected to Render PostgreSQL Database.');
      }
    });
  }
});

module.exports = {
  db,
  pool
};
