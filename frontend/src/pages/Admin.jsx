import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatearFecha, hoyLocal } from '../fechas.js';

const CLAVE_TOKEN = 'diabepie_token';
const ESTADOS = ['pendiente', 'confirmada', 'atendida', 'cancelada'];

const leerToken = () => {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN) || '';
  } catch {
    return '';
  }
};

export default function Admin() {
  const [token, setToken] = useState(leerToken);

  const entrar = (nuevo) => {
    try { sessionStorage.setItem(CLAVE_TOKEN, nuevo); } catch { /* sin almacenamiento */ }
    setToken(nuevo);
  };
  const salir = useCallback(() => {
    try { sessionStorage.removeItem(CLAVE_TOKEN); } catch { /* sin almacenamiento */ }
    setToken('');
  }, []);

  if (!token) return <Login onEntrar={entrar} />;
  return <Panel token={token} onSalir={salir} />;
}

function Login({ onEntrar }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const { token } = await api('/api/admin/login', { metodo: 'POST', cuerpo: { password } });
      onEntrar(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta login" onSubmit={enviar}>
      <h1>Panel de la clínica</h1>
      <label htmlFor="password">Contraseña</label>
      <input id="password" type="password" value={password} autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)} required />
      {error && <div className="alerta">{error}</div>}
      <button className="boton" type="submit" disabled={enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

function Panel({ token, onSalir }) {
  const [pestana, setPestana] = useState('citas');
  const [doctores, setDoctores] = useState([]);

  // Llama a la API con el token; si la sesión venció, cierra sesión
  const llamar = useCallback(
    (ruta, opciones = {}) =>
      api(ruta, { ...opciones, token }).catch((err) => {
        if (err.estado === 401) onSalir();
        throw err;
      }),
    [token, onSalir]
  );

  const cargarDoctores = useCallback(
    () => llamar('/api/admin/doctores').then(setDoctores).catch(() => {}),
    [llamar]
  );

  useEffect(() => {
    cargarDoctores();
  }, [cargarDoctores]);

  return (
    <>
      <div className="panel-barra">
        <div className="pestanas">
          <button className={`pestana${pestana === 'citas' ? ' activa' : ''}`} onClick={() => setPestana('citas')}>
            Citas
          </button>
          <button className={`pestana${pestana === 'doctores' ? ' activa' : ''}`} onClick={() => setPestana('doctores')}>
            Doctores
          </button>
        </div>
        <button className="boton-texto" onClick={onSalir}>Cerrar sesión</button>
      </div>

      {pestana === 'citas' ? (
        <Citas llamar={llamar} doctores={doctores} />
      ) : (
        <Doctores llamar={llamar} doctores={doctores} recargar={cargarDoctores} />
      )}
    </>
  );
}

function Citas({ llamar, doctores }) {
  const [filtros, setFiltros] = useState({ desde: hoyLocal(), hasta: '', doctorId: '', estado: '' });
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const parametros = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
    setCargando(true);
    setError('');
    llamar(`/api/admin/citas?${parametros}`)
      .then(setCitas)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [filtros, llamar]);

  const cambiarFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  async function cambiarEstado(id, estado) {
    setError('');
    try {
      await llamar(`/api/admin/citas/${id}`, { metodo: 'PATCH', cuerpo: { estado } });
      setCitas((lista) => lista.map((c) => (c.id === id ? { ...c, estado } : c)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="tarjeta">
      <div className="filtros">
        <div>
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" name="desde" value={filtros.desde} onChange={cambiarFiltro} />
        </div>
        <div>
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" name="hasta" value={filtros.hasta} onChange={cambiarFiltro} />
        </div>
        <div>
          <label htmlFor="doctorId">Doctor</label>
          <select id="doctorId" name="doctorId" value={filtros.doctorId} onChange={cambiarFiltro}>
            <option value="">Todos</option>
            {doctores.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="estado">Estado</label>
          <select id="estado" name="estado" value={filtros.estado} onChange={cambiarFiltro}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="alerta">{error}</div>}

      {cargando ? (
        <p className="ayuda">Cargando citas...</p>
      ) : citas.length === 0 ? (
        <p className="ayuda">No hay citas con estos filtros.</p>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Hora</th><th>Paciente</th><th>Contacto</th>
                <th>Doctor</th><th>Motivo</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id}>
                  <td className="sin-salto">{formatearFecha(c.fecha)}</td>
                  <td>{c.hora}</td>
                  <td>{c.paciente}</td>
                  <td className="contacto">
                    <a href={`tel:${c.celular}`}>{c.celular}</a>
                    {c.telefono_adicional && <a href={`tel:${c.telefono_adicional}`}>{c.telefono_adicional}</a>}
                    <a href={`mailto:${c.email}`}>{c.email}</a>
                  </td>
                  <td>{c.doctor}</td>
                  <td>{c.motivo || '—'}</td>
                  <td>
                    <select className={`estado estado-${c.estado}`} value={c.estado}
                      onChange={(e) => cambiarEstado(c.id, e.target.value)}>
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Doctores({ llamar, doctores, recargar }) {
  const [nuevo, setNuevo] = useState({ nombre: '', especialidad: '' });
  const [error, setError] = useState('');

  async function agregar(e) {
    e.preventDefault();
    setError('');
    try {
      await llamar('/api/admin/doctores', { metodo: 'POST', cuerpo: nuevo });
      setNuevo({ nombre: '', especialidad: '' });
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarActivo(doctor) {
    setError('');
    try {
      await llamar(`/api/admin/doctores/${doctor.id}`, { metodo: 'PATCH', cuerpo: { activo: !doctor.activo } });
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="tarjeta">
      <form className="filtros" onSubmit={agregar}>
        <div>
          <label htmlFor="nombreDoctor">Nombre</label>
          <input id="nombreDoctor" value={nuevo.nombre} required minLength={3}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Dr. / Dra. ..." />
        </div>
        <div>
          <label htmlFor="especialidad">Especialidad</label>
          <input id="especialidad" value={nuevo.especialidad}
            onChange={(e) => setNuevo({ ...nuevo, especialidad: e.target.value })} placeholder="Opcional" />
        </div>
        <div className="filtro-boton">
          <button className="boton" type="submit">Agregar doctor</button>
        </div>
      </form>

      {error && <div className="alerta">{error}</div>}

      <div className="tabla-scroll">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Especialidad</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {doctores.map((d) => (
              <tr key={d.id} className={d.activo ? '' : 'inactivo'}>
                <td>{d.nombre}</td>
                <td>{d.especialidad || '—'}</td>
                <td>{d.activo ? 'Activo' : 'Inactivo (no aparece al agendar)'}</td>
                <td>
                  <button className="boton-texto" onClick={() => cambiarActivo(d)}>
                    {d.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
