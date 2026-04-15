const { PrismaClient } = require('@prisma/client');

console.log("DEBUG: Conectando PrismaClient en la base de datos de Announcements.");

// Assemble DATABASE_URL from Docker Compose env vars (DB_HOST, DB_USER, etc.)
if (process.env.DB_HOST) {
    const port = process.env.DB_PORT || 3306;
    const dbPwd = process.env.DB_PASSWORD ? `:${process.env.DB_PASSWORD}` : '';
    process.env.DATABASE_URL = `mysql://${process.env.DB_USER}${dbPwd}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}`;
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

prisma.$connect()
    .then(() => console.log('✓ Announcements Service Connected to MySQL via Prisma'))
    .catch((err) => console.error('❌ Error connecting to database via Prisma:', err.message));

module.exports = { prisma };