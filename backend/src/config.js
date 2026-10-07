// Configuración de la agenda de la clínica. Ajusta estos valores a tu horario real.

// Horario de atención por día de la semana: 0 = domingo, 1 = lunes, ... 6 = sábado.
// Si un día no aparece aquí, la clínica no atiende ese día.
export const HORARIO = {
  1: { inicio: '08:00', fin: '17:00' }, // lunes
  2: { inicio: '08:00', fin: '17:00' }, // martes
  3: { inicio: '08:00', fin: '17:00' }, // miércoles
  4: { inicio: '08:00', fin: '17:00' }, // jueves
  5: { inicio: '08:00', fin: '17:00' }, // viernes
  6: { inicio: '08:00', fin: '12:00' }, // sábado
};

// Duración de cada cita en minutos (define cada cuánto aparece un horario: 08:00, 08:30, ...)
export const DURACION_CITA_MIN = 30;

// Con cuántos días de anticipación como máximo se puede agendar
export const DIAS_MAXIMOS_ADELANTE = 60;

// Zona horaria de la clínica. El servidor en la nube usa UTC, por eso hay que indicarla.
export const ZONA_HORARIA = process.env.ZONA_HORARIA || 'America/Mexico_City';
