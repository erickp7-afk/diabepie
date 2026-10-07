import pg from 'pg';

// Las columnas DATE se devuelven como texto 'YYYY-MM-DD'.
// Así evitamos que JavaScript las convierta a otra zona horaria y cambie el día.
pg.types.setTypeParser(1082, (valor) => valor);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
