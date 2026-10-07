// Nunca confiamos en lo que manda el frontend: todo se valida otra vez aquí.

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

// Quita espacios, guiones y paréntesis: "5555-1234" y "5555 1234" quedan iguales
const normalizarTelefono = (valor) => texto(valor).replace(/[\s\-().]/g, '');

const TELEFONO_RE = /^\+?\d{8,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCita(body = {}) {
  const datos = {
    nombre: texto(body.nombre),
    celular: normalizarTelefono(body.celular),
    telefonoAdicional: normalizarTelefono(body.telefonoAdicional) || null,
    email: texto(body.email).toLowerCase(),
    doctorId: Number(body.doctorId),
    fecha: texto(body.fecha),
    hora: texto(body.hora),
    motivo: texto(body.motivo).slice(0, 500) || null,
  };

  if (datos.nombre.length < 3 || datos.nombre.length > 120) {
    return { error: 'Escribe el nombre completo del paciente' };
  }
  if (!TELEFONO_RE.test(datos.celular)) {
    return { error: 'El número de celular no es válido (de 8 a 15 dígitos)' };
  }
  if (datos.telefonoAdicional && !TELEFONO_RE.test(datos.telefonoAdicional)) {
    return { error: 'El número adicional no es válido (de 8 a 15 dígitos)' };
  }
  if (!EMAIL_RE.test(datos.email) || datos.email.length > 254) {
    return { error: 'El correo electrónico no es válido' };
  }
  if (!Number.isInteger(datos.doctorId) || datos.doctorId <= 0) {
    return { error: 'Selecciona un doctor' };
  }
  if (!/^\d{2}:\d{2}$/.test(datos.hora)) {
    return { error: 'Selecciona un horario' };
  }
  return { datos };
}
