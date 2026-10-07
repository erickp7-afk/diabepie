// Las fechas viajan como texto 'YYYY-MM-DD' para evitar problemas de zona horaria

export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diaSemana(fecha) {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

// '2026-10-12' -> 'lunes, 12 de octubre de 2026'
export function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Fecha de hoy según la computadora de quien usa el panel
export function hoyLocal() {
  return new Date().toLocaleDateString('en-CA'); // en-CA da el formato YYYY-MM-DD
}
