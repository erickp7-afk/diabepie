// Rutas del panel de administración (requieren iniciar sesión)
import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requiereAdmin } from '../middleware/auth.js';
import { esFechaValida } from '../utils/horarios.js';

const router = Router();

const ESTADOS = ['pendiente', 'confirmada', 'atendida', 'cancelada'];

// Compara contraseñas en tiempo constante (evita ataques por tiempo de respuesta)
function mismaClave(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

router.post('/login', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!mismaClave(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  const token = jwt.sign({ rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Todo lo que está debajo de esta línea requiere sesión
router.use(requiereAdmin);

// ---------- Citas ----------

router.get('/citas', async (req, res) => {
  const { desde, hasta, doctorId, estado } = req.query;
  const condiciones = [];
  const valores = [];
  const agregar = (sql, valor) => {
    valores.push(valor);
    condiciones.push(sql.replace('?', `$${valores.length}`));
  };

  if (desde) {
    if (!esFechaValida(desde)) return res.status(400).json({ error: 'Fecha "desde" inválida' });
    agregar('c.fecha >= ?', desde);
  }
  if (hasta) {
    if (!esFechaValida(hasta)) return res.status(400).json({ error: 'Fecha "hasta" inválida' });
    agregar('c.fecha <= ?', hasta);
  }
  if (doctorId) agregar('c.doctor_id = ?', Number(doctorId) || 0);
  if (estado) {
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
    agregar('c.estado = ?', estado);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT c.id, c.fecha, to_char(c.hora, 'HH24:MI') AS hora, c.estado, c.motivo,
            p.nombre AS paciente, p.celular, p.telefono_adicional, p.email,
            d.nombre AS doctor
     FROM citas c
     JOIN pacientes p ON p.id = c.paciente_id
     JOIN doctores d ON d.id = c.doctor_id
     ${where}
     ORDER BY c.fecha, c.hora
     LIMIT 500`,
    valores
  );
  res.json(rows);
});

router.patch('/citas/:id', async (req, res) => {
  const estado = req.body?.estado;
  if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
  try {
    const { rows } = await pool.query(
      'UPDATE citas SET estado = $1 WHERE id = $2 RETURNING id, estado',
      [estado, Number(req.params.id) || 0]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    // Reactivar una cita cancelada cuyo horario ya ocupó otra persona
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese horario ya está ocupado por otra cita' });
    }
    throw err;
  }
});

// ---------- Doctores ----------

router.get('/doctores', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nombre, especialidad, activo FROM doctores ORDER BY activo DESC, nombre'
  );
  res.json(rows);
});

router.post('/doctores', async (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  const especialidad =
    typeof req.body?.especialidad === 'string' ? req.body.especialidad.trim() || null : null;
  if (nombre.length < 3 || nombre.length > 120) {
    return res.status(400).json({ error: 'Escribe el nombre del doctor' });
  }
  const { rows } = await pool.query(
    'INSERT INTO doctores (nombre, especialidad) VALUES ($1, $2) RETURNING id, nombre, especialidad, activo',
    [nombre, especialidad]
  );
  res.status(201).json(rows[0]);
});

router.patch('/doctores/:id', async (req, res) => {
  if (typeof req.body?.activo !== 'boolean') {
    return res.status(400).json({ error: 'Valor "activo" inválido' });
  }
  const { rows } = await pool.query(
    'UPDATE doctores SET activo = $1 WHERE id = $2 RETURNING id, nombre, especialidad, activo',
    [req.body.activo, Number(req.params.id) || 0]
  );
  if (!rows.length) return res.status(404).json({ error: 'Doctor no encontrado' });
  res.json(rows[0]);
});

export default router;
