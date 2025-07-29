import { defineConfig } from 'drizzle-kit';

// Clean up DATABASE_URL if it starts with 'psql'
let connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/bioscriptor_dev";

if (connectionString.startsWith("psql '") && connectionString.endsWith("'")) {
  connectionString = connectionString.slice(6, -1); // Remove "psql '" from start and "'" from end
}

// Additional cleanup for common malformed URLs
if (connectionString.includes('base')) {
  console.warn('⚠️ Detected malformed DATABASE_URL containing "base". Please check your environment variables.');
  connectionString = "postgresql://localhost:5432/bioscriptor_dev";
}

// Ensure SSL mode is set for Neon
if (connectionString.includes('neon.tech') && !connectionString.includes('sslmode=')) {
  connectionString += connectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './shared/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});