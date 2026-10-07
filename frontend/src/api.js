// Todas las llamadas al backend pasan por aquí
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado; // código HTTP (401, 409, ...) o 0 si no hubo conexión
  }
}

export async function api(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. Intenta de nuevo en unos segundos.', 0);
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ErrorApi(datos?.error || 'Ocurrió un error inesperado', respuesta.status);
  }
  return datos;
}
