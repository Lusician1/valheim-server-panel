const mysql = require("mysql2/promise");

const dbConfigured = Boolean(process.env.DB_HOST);

const pool = dbConfigured
  ? mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
  : null;

if (!dbConfigured) {
  console.warn(
    "No database configured: database features will contain placeholders.",
  );
}
