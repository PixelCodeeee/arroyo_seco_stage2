require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/reservas', require('./routes/reservas'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'reservation-service' });
});

// Database Initialization
async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS reserva (
                id_reserva INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                id_servicio INT NOT NULL,
                fecha DATE NOT NULL,
                hora TIME NOT NULL,
                numero_personas INT NOT NULL,
                estado ENUM('pendiente', 'confirmada', 'cancelada') DEFAULT 'pendiente',
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_servicio) REFERENCES servicio_restaurante(id_servicio) ON DELETE CASCADE
            )
        `);

        console.log('✓ Reservation Service tables initialized');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    await initDB();
    console.log(`Reservation Service running on port ${PORT}`);
});
