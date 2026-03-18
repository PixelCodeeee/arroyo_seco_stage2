require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/carrito', require('./routes/carrito'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'order-service' });
});

// Database Initialization
async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS pedido (
                id_pedido INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                monto_total DECIMAL(10, 2) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estado ENUM('pendiente', 'pagado', 'enviado', 'completado') DEFAULT 'pendiente',
                metodo_pago VARCHAR(50),
                FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS item_pedido (
                id_item_pedido INT AUTO_INCREMENT PRIMARY KEY,
                id_pedido INT NOT NULL,
                id_producto INT NOT NULL,
                cantidad INT NOT NULL,
                precio_compra DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
                FOREIGN KEY (id_producto) REFERENCES producto(id_producto)
            )
        `);

        // Note: CARRITO table might already exist or need creation.
        await db.query(`
            CREATE TABLE IF NOT EXISTS carrito (
                id_carrito INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                id_producto INT NOT NULL,
                cantidad INT DEFAULT 1,
                fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE
            )
        `);

        console.log('✓ Order Service tables initialized');
    } catch (error) {
        console.error('❌ Error initializing database tables:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    await initDB();
    console.log(`Order Service running on port ${PORT}`);
});
