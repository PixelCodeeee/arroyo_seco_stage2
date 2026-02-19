require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/usuarios', require('./routes/usuarios'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

// Database Initialization (Create tables if not exist)
async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                correo VARCHAR(255) UNIQUE NOT NULL,
                contrasena_hash VARCHAR(255) NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                rol ENUM('turista', 'oferente', 'admin') NOT NULL DEFAULT 'turista',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                esta_activo BOOLEAN DEFAULT TRUE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS codigo_2fa (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                codigo VARCHAR(6) NOT NULL,
                fecha_expiracion TIMESTAMP NOT NULL,
                usado BOOLEAN DEFAULT FALSE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
            )
        `);

        console.log('✓ Auth Service tables initialized');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    await initDB();
    console.log(`Auth Service running on port ${PORT}`);
});
