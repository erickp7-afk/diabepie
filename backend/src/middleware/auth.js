import jwt from 'jsonwebtoken';

// Deja pasar solo las peticiones que traen un token válido del panel de administración
export function requiereAdmin(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Tu sesión venció, inicia sesión de nuevo' });
  }
}
