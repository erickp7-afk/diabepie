import { HORARIO, DURACION_CITA_MIN, DIAS_MAXIMOS_ADELANTE, ZONA_HORARIA } from '../config.js';

// Todas las fechas se manejan como texto 'YYYY-MM-DD' y las horas como 'HH:MM'.
// Con ese formato se pueden comparar directamente con < y >.

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const aHora = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

// Fecha y hora actuales en la zona horaria de la clínica
export function ahoraEnClinica() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;
  return {
    fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
    hora: `${valor('hour')}:${valor('minute')}`,
  };
}

export function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const diaSemana = (fecha) => new Date(`${fecha}T00:00:00Z`).getUTCDay();

// Todos los horarios de atención de un día, según HORARIO y DURACION_CITA_MIN
function horariosDelDia(fecha) {
  const horario = HORARIO[diaSemana(fecha)];
  if (!horario) return [];
  const lista = [];
  const fin = aMinutos(horario.fin);
  for (let m = aMinutos(horario.inicio); m + DURACION_CITA_MIN <= fin; m += DURACION_CITA_MIN) {
    lista.push(aHora(m));
  }
  return lista;
}

// Devuelve un mensaje de error si no se puede agendar en esa fecha, o null si está bien
export function validarFechaAgendable(fecha) {
  if (!esFechaValida(fecha)) return 'Fecha inválida';
  const { fecha: hoy } = ahoraEnClinica();
  if (fecha < hoy) return 'No se puede agendar en una fecha pasada';
  if (fecha > sumarDias(hoy, DIAS_MAXIMOS_ADELANTE)) {
    return `Solo se puede agendar con un máximo de ${DIAS_MAXIMOS_ADELANTE} días de anticipación`;
  }
  if (!HORARIO[diaSemana(fecha)]) return 'La clínica no atiende ese día';
  return null;
}

// Horarios del día que todavía no han pasado
export function horariosFuturos(fecha) {
  const { fecha: hoy, hora } = ahoraEnClinica();
  const lista = horariosDelDia(fecha);
  return fecha === hoy ? lista.filter((h) => h > hora) : lista;
}
