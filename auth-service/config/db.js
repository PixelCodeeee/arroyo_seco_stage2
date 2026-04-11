const { PrismaClient } = require('@prisma/client');

console.log("DEBUG: Conectando PrismaClient en la base de datos.");

// Assemble DATABASE_URL strictly from manual env components to avoid stale .env Prisma strings, working seamlessly locally and in Docker Compose.
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

// Mantener compatibilidad mínima inicial con algo de consola, pero ahora la exportación es del ORM:
prisma.$connect()
    .then(() => console.log('✓ Auth Service Connected to MySQL database via Prisma ORM'))
    .catch((err) => console.error('❌ Error connecting to database via Prisma:', err.message));

module.exports = prisma;
