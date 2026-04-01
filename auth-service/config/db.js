const { PrismaClient } = require('@prisma/client');

console.log("DEBUG: Conectando PrismaClient en la base de datos.");

// Singleton pattern for PrismaClient
const prisma = new PrismaClient();

// Mantener compatibilidad mínima inicial con algo de consola, pero ahora la exportación es del ORM:
prisma.$connect()
    .then(() => console.log('✓ Auth Service Connected to MySQL database via Prisma ORM'))
    .catch((err) => console.error('❌ Error connecting to database via Prisma:', err.message));

module.exports = prisma;
