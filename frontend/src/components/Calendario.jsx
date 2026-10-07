import { useState } from 'react';
import { diaSemana, sumarDias } from '../fechas.js';

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const dosDigitos = (n) => String(n).padStart(2, '0');

// Calendario mensual. Solo deja escoger días entre hoy y hoy + diasMaximos
// en los que la clínica atiende (diasAbiertos: 0 = domingo ... 6 = sábado).
export default function Calendario({ valor, onSeleccionar, hoy, diasAbiertos, diasMaximos }) {
  const fechaMaxima = sumarDias(hoy, diasMaximos);
  const [anioHoy, mesHoy] = hoy.split('-').map(Number);
  const [vista, setVista] = useState({ anio: anioHoy, mes: mesHoy }); // mes de 1 a 12

  const mesVista = `${vista.anio}-${dosDigitos(vista.mes)}`;
  const diasEnMes = new Date(Date.UTC(vista.anio, vista.mes, 0)).getUTCDate();
  const huecosIniciales = (diaSemana(`${mesVista}-01`) + 6) % 7; // la semana empieza en lunes

  const celdas = Array(huecosIniciales).fill(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(`${mesVista}-${dosDigitos(d)}`);

  const moverMes = (delta) =>
    setVista(({ anio, mes }) => {
      const nuevo = mes + delta;
      if (nuevo < 1) return { anio: anio - 1, mes: 12 };
      if (nuevo > 12) return { anio: anio + 1, mes: 1 };
      return { anio, mes: nuevo };
    });

  return (
    <div className="calendario">
      <div className="calendario-cabecera">
        <button
          type="button"
          onClick={() => moverMes(-1)}
          disabled={mesVista <= hoy.slice(0, 7)}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <strong>
          {MESES[vista.mes - 1]} {vista.anio}
        </strong>
        <button
          type="button"
          onClick={() => moverMes(1)}
          disabled={mesVista >= fechaMaxima.slice(0, 7)}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="calendario-grid">
        {DIAS.map((d) => (
          <span key={d} className="calendario-dia-semana">
            {d}
          </span>
        ))}
        {celdas.map((fecha, i) => {
          if (!fecha) return <span key={`vacio-${i}`} />;
          const habilitado =
            fecha >= hoy && fecha <= fechaMaxima && diasAbiertos.includes(diaSemana(fecha));
          const clases = ['calendario-dia'];
          if (fecha === valor) clases.push('seleccionado');
          if (fecha === hoy) clases.push('hoy');
          return (
            <button
              key={fecha}
              type="button"
              className={clases.join(' ')}
              disabled={!habilitado}
              onClick={() => onSeleccionar(fecha)}
            >
              {Number(fecha.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
