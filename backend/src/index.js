import 'dotenv/config'; // carga el archivo .env (debe ir primero)
import express from 'express';
import cors from 'cors';
import publico from './routes/publico.js';
import admin from './routes/admin.js';

// Sin estas variables el sistema no puede funcionar: mejor detenerse con un mensaje claro
for (const variable of ['DATABASE_URL', 'ADMIN_PASSWORD', 'JWT_SECRET']) {
  if (!process.env[variable]) {
    console.error(`❌ Falta la variable de entorno ${variable}. Revisa tu archivo .env`);
    process.exit(1);
  }
}

const app = express();

// CORS: solo el frontend indicado en FRONTEND_URL puede llamar a esta API.
// Se pueden poner varias URLs separadas por coma.
const origenes = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''));
app.use(cors({ origin: origenes }));

app.use(express.json({ limit: '20kb' }));

// Para comprobar que el servidor está vivo (Render la usa como "health check")
app.get('/api/salud', (req, res) => res.json({ ok: true }));

app.use('/api/admin', admin);
app.use('/api', publico);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Cualquier error no controlado termina aquí
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Los datos enviados no son JSON válido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000; // en la nube, el hosting define PORT
app.listen(PORT, () => {
  console.log(`✅ API de Diabepie escuchando en http://localhost:${PORT}`);
});
