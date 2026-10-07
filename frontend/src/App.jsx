import { Link, Route, Routes } from 'react-router-dom';
import Agendar from './pages/Agendar.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <>
      <header className="encabezado">
        <div className="contenedor encabezado-interno">
          <Link to="/" className="marca">
            Diabe<span>pie</span>
          </Link>
          <span className="lema">Agenda tu cita en línea</span>
        </div>
      </header>

      <main className="contenedor">
        <Routes>
          <Route path="/" element={<Agendar />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <div className="tarjeta">
                Página no encontrada. <Link to="/">Volver al inicio</Link>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="pie">
        <div className="contenedor">© {new Date().getFullYear()} Clínica Diabepie</div>
      </footer>
    </>
  );
}
