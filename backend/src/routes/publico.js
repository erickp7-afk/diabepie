// Rutas que usan los pacientes para agendar (no requieren iniciar sesión)
import { Router } from 'express';
import { pool } from '../db.js';
import { HORARIO, DIAS_MAXIMOS_ADELANTE, DURACION_CITA_MIN } from '../config.js';
import { ahoraEnClinica, horariosFuturos, validarFechaAgendable } from '../utils/horarios.js';
import { validarCita } from '../utils/validaciones.js';

const router = Router();

// Datos que necesita el calendario del frontend
router.get('/config', (req, res) => {
  res.json({
    hoy: ahoraEnClinica().fecha,
    diasAbiertos: Object.keys(HORARIO).map(Number),
    diasMaximos: DIAS_MAXIMOS_ADELANTE,
    duracionMin: DURACION_CITA_MIN,
  });
});

router.get('/doctores', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nombre, especialidad FROM doctores WHERE activo ORDER BY nombre'
  );
  res.json(rows);
});

async function doctorActivo(doctorId) {
  const { rows } = await pool.query('SELECT 1 FROM doctores WHERE id = $1 AND activo', [doctorId]);
  return rows.length > 0;
}

async function horariosLibres(doctorId, fecha) {
  const { rows } = await pool.query(
    `SELECT to_char(hora, 'HH24:MI') AS hora FROM citas
     WHERE doctor_id = $1 AND fecha = $2 AND estado <> 'cancelada'`,
    [doctorId, fecha]
  );
  const ocupados = new Set(rows.map((r) => r.hora));
  return horariosFuturos(fecha).filter((h) => !ocupados.has(h));
}

// Horarios libres de un doctor en una fecha: /api/disponibilidad?doctorId=1&fecha=2026-10-20
router.get('/disponibilidad', async (req, res) => {
  const doctorId = Number(req.query.doctorId);
  const fecha = String(req.query.fecha || '');

  if (!Number.isInteger(doctorId) || doctorId <= 0) {
    return res.status(400).json({ error: 'Doctor inválido' });
  }
  const errorFecha = validarFechaAgendable(fecha);
  if (errorFecha) return res.status(400).json({ error: errorFecha });
  if (!(await doctorActivo(doctorId))) {
    return res.status(404).json({ error: 'Doctor no encontrado' });
  }

  res.json({ horarios: await horariosLibres(doctorId, fecha) });
});

// Agendar una cita
router.post('/citas', async (req, res) => {
  const { datos, error } = validarCita(req.body);
  if (error) return res.status(400).json({ error });

  const errorFecha = validarFechaAgendable(datos.fecha);
  if (errorFecha) return res.status(400).json({ error: errorFecha });
  if (!horariosFuturos(datos.fecha).includes(datos.hora)) {
    return res.status(400).json({ error: 'Ese horario no está disponible' });
  }
  if (!(await doctorActivo(datos.doctorId))) {
    return res.status(404).json({ error: 'Doctor no encontrado' });
  }

  // Transacción: el paciente y la cita se guardan juntos, o no se guarda nada
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // Si el celular ya existe, reutilizamos al paciente y actualizamos sus datos
    const { rows: [paciente] } = await cliente.query(
      `INSERT INTO pacientes (nombre, celular, telefono_adicional, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (celular) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         telefono_adicional = EXCLUDED.telefono_adicional,
         email = EXCLUDED.email
       RETURNING id`,
      [datos.nombre, datos.celular, datos.telefonoAdicional, datos.email]
    );

    const { rows: [cita] } = await cliente.query(
      `INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, fecha, to_char(hora, 'HH24:MI') AS hora, estado`,
      [paciente.id, datos.doctorId, datos.fecha, datos.hora, datos.motivo]
    );

    await cliente.query('COMMIT');
    res.status(201).json(cita);
  } catch (err) {
    await cliente.query('ROLLBACK');
    // 23505 = violación de índice único: alguien reservó ese horario un instante antes
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Ese horario acaba de ser reservado por otra persona. Por favor elige otro.',
      });
    }
    throw err;
  } finally {
    cliente.release();
  }
});

export default router;
