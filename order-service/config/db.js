const mysql = require('mysql2');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'AlphaPrime1.',
    database: process.env.DB_NAME || 'arroyo_seco',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Get promise-based connection
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        return;
    }
    console.log(`✓ Order Service Connected to MySQL database on ${dbConfig.host}`);
    connection.release();
});

module.exports = promisePool;
