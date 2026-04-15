import "dotenv/config";
import { defineConfig } from "prisma/config";

// Assemble the URL manually for the CLI
const dbUser = process.env.DB_USER || 'root';
const dbPwd = process.env.DB_PASSWORD ? `:${process.env.DB_PASSWORD}` : '';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || 'arroyo_seco';

const generatedUrl = `mysql://${dbUser}${dbPwd}@${dbHost}:${dbPort}/${dbName}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: generatedUrl, // Use the assembled URL here
  },
});