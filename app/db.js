const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'recipe_user',
  password: process.env.DB_PASSWORD || 'recipe_secret_123',
  database: process.env.DB_NAME || 'recipe_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to check and retry DB connection on startup
async function testConnection(retries = 15, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log(' Successfully connected to MySQL database with utf8mb4!');
      connection.release();
      return true;
    } catch (err) {
      console.log(` Database connection attempt ${i + 1}/${retries} failed: ${err.message}. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error(' Could not connect to MySQL database after maximum retries.');
  return false;
}

module.exports = { pool, testConnection };
