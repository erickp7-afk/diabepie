import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Calendario from '../components/Calendario.jsx';
import { formatearFecha } from '../fechas.js';

const PACIENTE_VACIO = { nombre: '', celular: '', telefonoAdicional: '', email: '', motivo: '' };

export default function Agendar() {
  const [config, setConfig] = useState(null);
  const [doctores, setDoctores] = useState([]);
  const [errorCarga, setErrorCarga] = useState('');

  const [doctorId, setDoctorId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [recargar, setRecargar] = useState(0);

  const [paciente, setPaciente] = useState(PACIENTE_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [citaConfirmada, setCitaConfirmada] = useState(null);

  // Al abrir la página: configuración del calendario y lista de doctores
  useEffect(() => {
    Promise.all([api('/api/config'), api('/api/doctores')])
      .then(([datosConfig, listaDoctores]) => {
        setConfig(datosConfig);
        setDoctores(listaDoctores);
      })
      .catch((err) => setErrorCarga(err.message));
  }, []);

  // Cada vez que cambia el doctor o la fecha, pedimos los horarios libres
  useEffect(() => {
    setHora('');
    setHorarios([]);
    if (!doctorId || !fecha) return;

    let cancelado = false;
    setCargandoHorarios(true);
    api(`/api/disponibilidad?doctorId=${doctorId}&fecha=${fecha}`)
      .then((r) => !cancelado && setHorarios(r.horarios))
      .catch((err) => !cancelado && setError(err.message))
      .finally(() => !cancelado && setCargandoHorarios(false));
    return () => {
      cancelado = true;
    };
  }, [doctorId, fecha, recargar]);

  const cambiarCampo = (e) => setPaciente({ ...paciente, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!doctorId || !fecha || !hora) {
      setError('Selecciona doctor, fecha y horario antes de confirmar');
      return;
    }
    setEnviando(true);
    try {
      const cita = await api('/api/citas', {
        metodo: 'POST',
        cuerpo: { ...paciente, doctorId: Number(doctorId), fecha, hora },
      });
      const doctor = doctores.find((d) => d.id === Number(doctorId));
      setCitaConfirmada({ ...cita, doctor: doctor?.nombre, paciente: paciente.nombre });
    } catch (err) {
      setError(err.message);
      if (err.estado === 409) setRecargar((n) => n + 1); // alguien tomó ese horario: refrescamos
    } finally {
      setEnviando(false);
    }
  }

  function agendarOtra() {
    setCitaConfirmada(null);
    setPaciente(PACIENTE_VACIO);
    setFecha('');
    setDoctorId('');
  }

  if (errorCarga) {
    return <div className="alerta">{errorCarga}</div>;
  }
  if (!config) {
    return <p className="ayuda centrado">Cargando...</p>;
  }

  if (citaConfirmada) {
    return (
      <div className="tarjeta confirmacion">
        <div className="confirmacion-icono">✓</div>
        <h1>¡Cita agendada!</h1>
        <p>
          <strong>{citaConfirmada.paciente}</strong>, tu cita quedó registrada:
        </p>
        <ul className="resumen">
          <li><span>Doctor</span>{citaConfirmada.doctor}</li>
          <li><span>Fecha</span>{formatearFecha(citaConfirmada.fecha)}</li>
          <li><span>Hora</span>{citaConfirmada.hora}</li>
          <li><span>N.º de cita</span>#{citaConfirmada.id}</li>
        </ul>
        <p className="ayuda">La clínica se comunicará contigo para confirmarla.</p>
        <button className="boton" onClick={agendarOtra}>
          Agendar otra cita
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <h1 className="titulo-pagina">Agenda tu cita</h1>

      <section className="tarjeta">
        <h2 className="paso-titulo"><span className="paso-numero">1</span>Elige al doctor</h2>
        <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
          <option value="">— Selecciona un doctor —</option>
          {doctores.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}{d.especialidad ? ` · ${d.especialidad}` : ''}
            </option>
          ))}
        </select>
      </section>

      <section className="tarjeta">
        <h2 className="paso-titulo"><span className="paso-numero">2</span>Elige fecha y hora</h2>
        <div className="agenda">
          <Calendario
            valor={fecha}
            onSeleccionar={setFecha}
            hoy={config.hoy}
            diasAbiertos={config.diasAbiertos}
            diasMaximos={config.diasMaximos}
          />
          <div>
            {!doctorId && <p className="ayuda">Primero elige un doctor.</p>}
            {doctorId && !fecha && <p className="ayuda">Selecciona un día en el calendario.</p>}
            {doctorId && fecha && (
              <>
                <p className="fecha-elegida">{formatearFecha(fecha)}</p>
                {cargandoHorarios && <p className="ayuda">Buscando horarios disponibles...</p>}
                {!cargandoHorarios && horarios.length === 0 && (
                  <p className="ayuda">No hay horarios libres este día. Prueba con otra fecha.</p>
                )}
                <div className="horarios">
                  {horarios.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`horario${h === hora ? ' seleccionado' : ''}`}
                      onClick={() => setHora(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="tarjeta">
        <h2 className="paso-titulo"><span className="paso-numero">3</span>Datos del paciente</h2>
        <div className="campos">
          <div className="campo-ancho">
            <label htmlFor="nombre">Nombre completo *</label>
            <input id="nombre" name="nombre" value={paciente.nombre} onChange={cambiarCampo}
              autoComplete="name" required minLength={3} maxLength={120} />
          </div>
          <div>
            <label htmlFor="celular">Número de celular *</label>
            <input id="celular" name="celular" type="tel" value={paciente.celular} onChange={cambiarCampo}
              autoComplete="tel" required placeholder="Ej. 5555 1234" />
          </div>
          <div>
            <label htmlFor="telefonoAdicional">Número adicional</label>
            <input id="telefonoAdicional" name="telefonoAdicional" type="tel"
              value={paciente.telefonoAdicional} onChange={cambiarCampo} placeholder="Opcional" />
          </div>
          <div className="campo-ancho">
            <label htmlFor="email">Correo electrónico *</label>
            <input id="email" name="email" type="email" value={paciente.email} onChange={cambiarCampo}
              autoComplete="email" required />
          </div>
          <div className="campo-ancho">
            <label htmlFor="motivo">Motivo de la consulta</label>
            <textarea id="motivo" name="motivo" rows={3} maxLength={500} value={paciente.motivo}
              onChange={cambiarCampo} placeholder="Opcional" />
          </div>
        </div>
      </section>

      {error && <div className="alerta">{error}</div>}

      <div className="acciones">
        {hora && (
          <p className="ayuda">
            Cita el {formatearFecha(fecha)} a las <strong>{hora}</strong>
          </p>
        )}
        <button className="boton boton-grande" type="submit" disabled={enviando || !hora}>
          {enviando ? 'Agendando...' : 'Confirmar cita'}
        </button>
      </div>
    </form>
  );
}
