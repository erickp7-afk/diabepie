// Crea las tablas en la base de datos ejecutando db/schema.sql
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('❌ Falta DATABASE_URL en el archivo .env');
  process.exit(1);
}

const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await cliente.connect();
  await cliente.query(sql);
  console.log('✅ Base de datos lista: tablas creadas y doctores de ejemplo cargados.');
} catch (err) {
  console.error('❌ No se pudo inicializar la base de datos:', err.message);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
