const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5006;

async function initDB() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                image_url VARCHAR(500),
                event_date DATE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Announcements table ready');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

app.get('/announcements', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM announcements WHERE is_active = TRUE ORDER BY event_date ASC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/announcements/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM announcements WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/announcements', async (req, res) => {
    try {
        const { title, description, image_url, event_date } = req.body;
        const [result] = await db.query(
            `INSERT INTO announcements (title, description, image_url, event_date)
             VALUES (?, ?, ?, ?)`,
            [title, description, image_url, event_date]
        );
        res.status(201).json({ message: 'Announcement created', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/announcements/:id', async (req, res) => {
    try {
        const { title, description, image_url, event_date, is_active } = req.body;
        await db.query(
            `UPDATE announcements SET title = ?, description = ?, image_url = ?, event_date = ?, is_active = ? WHERE id = ?`,
            [title, description, image_url, event_date, is_active, req.params.id]
        );
        res.json({ message: 'Announcement updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/announcements/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, async () => {
    console.log(`🚀 Announcements Service running on port ${PORT}`);
    await initDB();
});