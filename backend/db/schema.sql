-- Esquema de la base de datos de Diabepie.
-- Se puede ejecutar varias veces sin duplicar nada (npm run db:init).

CREATE TABLE IF NOT EXISTS doctores (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  especialidad TEXT,
  activo       BOOLEAN NOT NULL DEFAULT true,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id                 SERIAL PRIMARY KEY,
  nombre             TEXT NOT NULL,
  celular            TEXT NOT NULL UNIQUE,
  telefono_adicional TEXT,
  email              TEXT NOT NULL,
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citas (
  id          SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL REFERENCES pacientes(id),
  doctor_id   INT NOT NULL REFERENCES doctores(id),
  fecha       DATE NOT NULL,
  hora        TIME NOT NULL,
  motivo      TEXT,
  estado      TEXT NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente', 'confirmada', 'atendida', 'cancelada')),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un doctor no puede tener dos citas activas a la misma fecha y hora.
-- Las citas canceladas no cuentan, así ese horario se libera.
CREATE UNIQUE INDEX IF NOT EXISTS citas_sin_choque
  ON citas (doctor_id, fecha, hora)
  WHERE estado <> 'cancelada';

CREATE INDEX IF NOT EXISTS citas_por_fecha ON citas (fecha);

-- Doctores de ejemplo (solo si la tabla está vacía). Cámbialos desde el panel /admin.
INSERT INTO doctores (nombre, especialidad)
SELECT * FROM (VALUES
  ('Dra. Ana López', 'Podología'),
  ('Dr. Carlos Méndez', 'Endocrinología'),
  ('Dra. Lucía Herrera', 'Medicina general')
) AS ejemplo(nombre, especialidad)
WHERE NOT EXISTS (SELECT 1 FROM doctores);
