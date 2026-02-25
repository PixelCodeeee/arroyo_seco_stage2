require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[Catalog] ${req.method} ${req.path}`);
    console.log('[Catalog] Headers:', req.headers);
    console.log('[Catalog] Body:', req.body);
    next();
});

// Routes
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/oferentes', require('./routes/oferentes'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/productos', require('./routes/productos'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'catalog-service' });
});

// Database Initialization
async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS categoria (
                id_categoria INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                tipo ENUM('gastronomica', 'artesanal') NOT NULL
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS oferente (
                id_oferente INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                nombre_negocio VARCHAR(100) NOT NULL,
                direccion VARCHAR(255),
                tipo ENUM('restaurante', 'artesanal') NOT NULL,
                estado ENUM('pendiente', 'aprobado', 'suspendido') DEFAULT 'pendiente',
                horario_disponibilidad JSON,
                imagen VARCHAR(255),
                telefono VARCHAR(20),
                FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS servicio_restaurante (
                id_servicio INT AUTO_INCREMENT PRIMARY KEY,
                id_oferente INT NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                rango_precio VARCHAR(50),
                capacidad INT,
                estatus BOOLEAN DEFAULT TRUE,
                imagenes JSON,
                FOREIGN KEY (id_oferente) REFERENCES oferente(id_oferente) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS producto (
                id_producto INT AUTO_INCREMENT PRIMARY KEY,
                id_oferente INT NOT NULL,
                id_categoria INT,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                precio DECIMAL(10, 2) NOT NULL,
                inventario INT DEFAULT 0,
                imagenes JSON,
                estatus BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (id_oferente) REFERENCES oferente(id_oferente) ON DELETE CASCADE,
                FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE SET NULL
            )
        `);

        console.log('✓ Catalog Service tables initialized');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
    }
}

// Start server
if (require.main === module) {
    app.listen(PORT, async () => {
        await initDB();
        console.log(`Catalog Service running on port ${PORT}`);
    });
}

module.exports = app;
