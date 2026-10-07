# Diabepie: guía paso a paso (de cero a producción)

Sistema de citas para la clínica Diabepie.

- **Pacientes** (`/`): eligen doctor, fecha en un calendario, hora disponible y dejan sus datos (nombre, celular, número adicional, correo y motivo).
- **Clínica** (`/admin`): ve las citas, las filtra, cambia su estado (pendiente, confirmada, atendida o cancelada) y administra doctores.

```
Navegador ──▶ Frontend (React, en Vercel) ──▶ Backend (Node/Express, en Render) ──▶ PostgreSQL (Neon)
```

## Estructura del proyecto

```
diabepie/
├── backend/                 ← API (Node.js + Express)
│   ├── db/schema.sql        ← tablas de la base de datos
│   ├── scripts/init-db.js   ← crea las tablas (npm run db:init)
│   ├── src/
│   │   ├── index.js         ← arranque del servidor
│   │   ├── config.js        ← HORARIO DE LA CLÍNICA (edítalo aquí)
│   │   ├── db.js            ← conexión a PostgreSQL
│   │   ├── routes/publico.js← rutas para pacientes
│   │   ├── routes/admin.js  ← rutas del panel (con contraseña)
│   │   ├── middleware/auth.js
│   │   └── utils/           ← validaciones y cálculo de horarios
│   └── .env.example
└── frontend/                ← página web (React + Vite)
    ├── src/
    │   ├── pages/Agendar.jsx    ← página para agendar
    │   ├── pages/Admin.jsx      ← panel de la clínica
    │   ├── components/Calendario.jsx
    │   ├── api.js               ← llamadas al backend
    │   └── styles.css
    ├── vercel.json
    └── .env.example
```

---

## FASE 1: Instalar herramientas (una sola vez)

| Herramienta | Para qué | Descarga |
|---|---|---|
| **Node.js LTS** | Ejecutar JavaScript fuera del navegador; trae `npm` | https://nodejs.org (botón "LTS") |
| **Git** | Control de versiones; subir el código a GitHub | https://git-scm.com/download/win |
| **VS Code** | Editor de código | https://code.visualstudio.com |

Instala los tres con las opciones por defecto ("Next, Next, Finish").
**Cierra y vuelve a abrir** VS Code o la terminal después de instalar.

Comprueba la instalación en una terminal (en VS Code: menú *Terminal → New Terminal*):

```bash
node -v
```
```bash
npm -v
```
```bash
git --version
```

Cada comando debe mostrar un número de versión. Node debe ser **20 o superior**.

> ⚠️ **Si `npm` da el error "la ejecución de scripts está deshabilitada en este sistema"**: es una
> protección de PowerShell. Tienes dos opciones:
> 1. En VS Code, cambia la terminal a **Command Prompt** (flecha ˅ junto al `+` de la terminal → *Command Prompt*).
> 2. O ejecuta una vez en PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y responde `S`.

Configura tu nombre en Git (una sola vez):

```bash
git config --global user.name "Tu Nombre"
```
```bash
git config --global user.email "tu-correo@ejemplo.com"
```

**Crea estas cuentas** (puedes entrar a las tres últimas con tu cuenta de GitHub):
1. https://github.com
2. https://neon.tech (base de datos)
3. https://render.com (backend)
4. https://vercel.com (frontend)

---

## FASE 2: Base de datos en la nube (Neon)

1. Entra a https://console.neon.tech y crea un proyecto:
   - Nombre: `diabepie`
   - Versión de Postgres: la que viene por defecto
   - Región: la más cercana a tu país (por ejemplo, *US East*)
2. En el panel del proyecto, haz clic en **Connect**.
3. Copia el **connection string**. Se ve así:
   `postgresql://neondb_owner:XXXX@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

🔒 Ese texto contiene la contraseña de tu base de datos. **No lo compartas ni lo subas a GitHub.**

---

## FASE 3: Correr el backend en tu computadora

Abre la carpeta `diabepie` en VS Code (*File → Open Folder*). Luego abre una terminal y escribe:

```bash
cd backend
```
```bash
npm install
```

`npm install` descarga las librerías listadas en `package.json` (express, pg, etc.) a la carpeta `node_modules`.

### Crear el archivo `.env`

1. En VS Code, dentro de `backend`, copia `.env.example` y renombra la copia a `.env`. También puedes usar este comando:
   ```bash
   copy .env.example .env
   ```
2. Abre `.env` y llena los valores:
   - `DATABASE_URL`: pega el connection string de Neon.
   - `ADMIN_PASSWORD`: inventa una contraseña para el panel.
   - `JWT_SECRET`: genera un texto aleatorio con este comando y pega el resultado:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - `ZONA_HORARIA`: la de tu país, por ejemplo `America/Guatemala`, `America/Mexico_City`, `America/Bogota` o `America/Lima`.

### Crear las tablas

```bash
npm run db:init
```

Debe mostrar `✅ Base de datos lista`. Puedes comprobarlo en Neon, en **Tables**: ahí aparecen `doctores`, `pacientes` y `citas`.

### Arrancar el servidor

```bash
npm run dev
```

Debe decir `✅ API de Diabepie escuchando en http://localhost:3000`.
Para probarlo, abre en tu navegador http://localhost:3000/api/doctores. Debes ver los 3 doctores de ejemplo en formato JSON.

**Deja esta terminal abierta.** El servidor se reinicia solo cuando guardas cambios.

---

## FASE 4: Correr el frontend en tu computadora

Abre **otra** terminal (botón `+`) y escribe:

```bash
cd frontend
```
```bash
npm install
```
```bash
npm run dev
```

Abre http://localhost:5173 y deberías ver la página para agendar.

✅ **Prueba completa:**
1. Agenda una cita: elige doctor, día, hora, llena los datos y haz clic en *Confirmar cita*.
2. Entra a http://localhost:5173/admin con tu `ADMIN_PASSWORD`. La cita debe aparecer en la lista.
3. Cambia el estado de la cita y prueba agregar un doctor.
4. Intenta agendar otra vez el mismo doctor, día y hora. Ese horario ya no debe aparecer.

(El frontend usa `http://localhost:3000` por defecto, así que en local no necesitas `.env` en `frontend`.)

### Personalizar el horario

Edita `backend/src/config.js`:
- `HORARIO`: días y horas de atención.
- `DURACION_CITA_MIN`: duración de cada cita.
- `DIAS_MAXIMOS_ADELANTE`: con cuántos días de anticipación se puede agendar.

---

## FASE 5: Subir el código a GitHub

1. En GitHub, haz clic en **New repository**:
   - Nombre: `diabepie`
   - Visibilidad: **Private**
   - No marques "Add a README"
   - Haz clic en **Create repository**
2. En una terminal, ubicada en la carpeta raíz `diabepie` (no en backend ni frontend):

```bash
git init
```
```bash
git add .
```
```bash
git commit -m "Primera versión de Diabepie"
```
```bash
git branch -M main
```
```bash
git remote add origin https://github.com/TU-USUARIO/diabepie.git
```
```bash
git push -u origin main
```

La primera vez se abre una ventana para iniciar sesión en GitHub.
Revisa en GitHub que **no** aparezca ningún archivo `.env`. El `.gitignore` lo evita.

> Si prefieres no usar comandos, puedes hacer lo mismo con **GitHub Desktop** (https://desktop.github.com).

---

## FASE 6: Publicar el backend en Render

1. En https://dashboard.render.com, haz clic en **New + → Web Service**.
2. Conecta tu cuenta de GitHub y elige el repositorio `diabepie`.
3. Configura:

| Campo | Valor |
|---|---|
| Name | `diabepie-api` |
| Region | La más cercana a la que elegiste en Neon |
| Branch | `main` |
| **Root Directory** | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

4. En **Environment Variables** agrega:

| Clave | Valor |
|---|---|
| `DATABASE_URL` | Tu connection string de Neon |
| `ADMIN_PASSWORD` | Una contraseña **distinta y fuerte** para producción |
| `JWT_SECRET` | Un texto aleatorio nuevo (genera otro con el comando de la Fase 3) |
| `ZONA_HORARIA` | La de tu país |
| `FRONTEND_URL` | Por ahora `http://localhost:5173`; lo cambias en la Fase 8 |

5. En **Advanced → Health Check Path** escribe `/api/salud`.
6. Haz clic en **Create Web Service** y espera a que el estado diga **Live**.
7. Copia la URL que te da Render, por ejemplo `https://diabepie-api.onrender.com`.
   Pruébala abriendo `https://diabepie-api.onrender.com/api/doctores`.

> No hace falta correr `db:init` otra vez: el backend en Render usa la misma base de datos de Neon.

---

## FASE 7: Publicar el frontend en Vercel

1. En https://vercel.com/new, importa el repositorio `diabepie`.
2. Configura:
   - **Root Directory**: haz clic en *Edit* y elige `frontend`.
   - Framework Preset: **Vite** (se detecta solo).
3. En **Environment Variables** agrega:
   - `VITE_API_URL` = `https://diabepie-api.onrender.com` (tu URL de Render, **sin** `/` al final)
4. Haz clic en **Deploy**. Al terminar tendrás una URL como `https://diabepie.vercel.app`.

---

## FASE 8: Conectar frontend y backend

1. En Render, ve a tu servicio → **Environment** y cambia
   `FRONTEND_URL` = `https://diabepie.vercel.app` (tu URL de Vercel, sin `/` al final).
   Si también quieres seguir probando en local, pon ambas separadas por coma:
   `https://diabepie.vercel.app,http://localhost:5173`
2. Guarda con **Save, rebuild and deploy**.
3. Abre tu URL de Vercel, agenda una cita de prueba y revísala en `/admin`. 🎉

**A partir de ahora**, cada vez que hagas cambios:

```bash
git add .
```
```bash
git commit -m "Describe el cambio"
```
```bash
git push
```

Render y Vercel detectan el push y vuelven a publicar todo automáticamente.

---

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `node` o `npm` "no se reconoce" | Cierra y abre VS Code o la terminal después de instalar Node |
| "La ejecución de scripts está deshabilitada" | Mira la nota de la Fase 1 |
| `npm run db:init` falla con un error de conexión | Revisa `DATABASE_URL` en `.env`: completo, sin espacios y con `?sslmode=require` |
| "Falta la variable de entorno ..." | Falta esa variable en `.env` (local) o en *Environment* de Render |
| Error de **CORS** en la consola del navegador (F12) | `FRONTEND_URL` en Render no coincide exactamente con la URL de Vercel |
| En producción dice "No se pudo conectar con el servidor" | Revisa `VITE_API_URL` en Vercel y luego haz *Redeploy*; las variables `VITE_` se aplican al construir |
| La primera carga tarda unos 50 segundos | El plan gratis de Render "duerme" el servidor cuando no se usa; es normal |
| `/admin` da 404 en Vercel | Verifica que `frontend/vercel.json` esté en el repositorio |
| Los horarios de "hoy" salen mal | Revisa `ZONA_HORARIA` |
| Aparece un aviso "SECURITY WARNING ... sslmode" | Es solo informativo de la librería `pg`; la conexión funciona y es segura |

## Siguientes mejoras sugeridas

- Enviar correo o WhatsApp de confirmación (por ejemplo con Resend o Twilio).
- Horarios distintos por doctor y días bloqueados (vacaciones, feriados).
- Usuarios individuales para el personal de la clínica en lugar de una sola contraseña.
- Dominio propio (por ejemplo `citas.diabepie.com`), que se configura en Vercel.
- Límite de intentos (rate limiting) en el login y al agendar.
