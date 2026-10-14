# 🗓️ Sistema de Gestión de Reservas - Backend API

API REST moderna y escalable desarrollada con **Node.js**, **Express** y **Supabase** (PostgreSQL) para la gestión y control de reservas con validación en tiempo real de disponibilidad y prevención de solapamientos horarios.

---

## 🚀 Stack Tecnológico

- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules: `"type": "module"`)
- **Framework Web:** [Express.js](https://expressjs.com/)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) (@supabase/supabase-js) / PostgreSQL
- **Utilidades:**
  - `dotenv` (Gestión de variables de entorno)
  - `cors` (Manejo de Cross-Origin Resource Sharing)
  - `nodemon` (Hot-reloading para entorno de desarrollo)

---

## ✨ Características Principales

- **Gestión de Reservas:** Creación, consulta y cancelación lógica de reservas.
- **Prevención de Conflictos Horarios:** Detección de solapamiento en reservas existentes con estado `confirmada` para una misma fecha. Si existe colisión horaria, el sistema responde con código HTTP **409 Conflict**.
- **Validaciones Rigurosas:**
  - Validación de campos requeridos (código **400 Bad Request** si falta información).
  - Coherencia temporal: `hora_inicio` debe ser estrictamente menor que `hora_fin`.
- **Filtrado por Fecha:** Parámetro opcional de consulta `?fecha=YYYY-MM-DD` para obtener únicamente las reservas de una jornada específica.
- **Cancelación Segura:** Actualización de estado a `cancelada` preservando el historial en la base de datos.
- **Health Check:** Endpoint para monitoreo del estado de la API (`/api/health`).

---

## 📁 Estructura del Proyecto

```text
├── src/
│   ├── config/
│   │   └── supabase.js            # Inicialización del cliente Supabase
│   ├── controllers/
│   │   └── reservasController.js  # Lógica de negocio y consultas
│   ├── routes/
│   │   └── reservasRoutes.js      # Definición de rutas Express
│   └── index.js                   # Punto de entrada y configuración del servidor
├── .env.example                   # Plantilla de variables de entorno
├── .gitignore                     # Archivos y carpetas excluidas de Git
├── package.json                   # Dependencias y scripts del proyecto
└── README.md                      # Documentación del proyecto
```

---

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior.
- [Git](https://git-scm.com/).
- Cuenta en [Supabase](https://supabase.com/) con un proyecto activo.

### Esquema de Base de Datos en Supabase

Crea la tabla `reservas` en el **SQL Editor** de tu panel de Supabase:

```sql
CREATE TABLE IF NOT EXISTS reservas (
  id BIGSERIAL PRIMARY KEY,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado TEXT DEFAULT 'confirmada' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de Row Level Security (RLS) para desarrollo
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de reservas" ON reservas
  FOR SELECT USING (true);

CREATE POLICY "Inserción pública de reservas" ON reservas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Actualización pública de reservas" ON reservas
  FOR UPDATE USING (true);
```

---

## ⚙️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/CesarManz/sistema-reservas-backend.git
cd sistema-reservas-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con las credenciales de tu proyecto Supabase:

```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key-o-service-role-key
```

### 4. Ejecutar el servidor

- **Modo Desarrollo (con reinicio automático al guardar cambios):**
  ```bash
  npm run dev
  ```

- **Modo Producción:**
  ```bash
  npm start
  ```

El servidor estará escuchando por defecto en: `http://localhost:3000`

---

## 📖 Documentación de la API

### 1. Health Check

Verifica que el servicio esté operativo.

- **Método:** `GET`
- **Ruta:** `/api/health`
- **Respuesta (200 OK):**
  ```json
  {
    "status": "ok"
  }
  ```

---

### 2. Obtener Reservas

Obtiene las reservas ordenadas ascendentemente por `fecha` y `hora_inicio`. Permite filtrar por una fecha específica.

- **Método:** `GET`
- **Ruta:** `/api/reservas`
- **Query Params (opcional):**
  - `fecha`: Fecha en formato `YYYY-MM-DD` (ejemplo: `/api/reservas?fecha=2026-10-20`)

- **Respuesta Exitosa (200 OK):**
  ```json
  [
    {
      "id": 1,
      "cliente_nombre": "Carlos López",
      "cliente_email": "carlos@example.com",
      "fecha": "2026-10-20",
      "hora_inicio": "10:00:00",
      "hora_fin": "11:00:00",
      "estado": "confirmada",
      "created_at": "2026-10-14T23:17:40.000Z"
    }
  ]
  ```

---

### 3. Crear una Reserva

Registra una nueva reserva validando disponibilidad y coherencia horaria.

- **Método:** `POST`
- **Ruta:** `/api/reservas`
- **Headers:** `Content-Type: application/json`
- **Cuerpo de la Petición (Body):**
  ```json
  {
    "cliente_nombre": "Carlos López",
    "cliente_email": "carlos@example.com",
    "fecha": "2026-10-20",
    "hora_inicio": "10:00",
    "hora_fin": "11:00"
  }
  ```

- **Respuestas:**
  - **201 Created (Éxito):**
    ```json
    {
      "id": 1,
      "cliente_nombre": "Carlos López",
      "cliente_email": "carlos@example.com",
      "fecha": "2026-10-20",
      "hora_inicio": "10:00:00",
      "hora_fin": "11:00:00",
      "estado": "confirmada",
      "created_at": "2026-10-14T23:17:40.000Z"
    }
    ```

  - **400 Bad Request (Faltan campos obligatorios):**
    ```json
    {
      "error": "Todos los campos son requeridos: cliente_nombre, cliente_email, fecha, hora_inicio, hora_fin."
    }
    ```

  - **400 Bad Request (Horario inconsistente):**
    ```json
    {
      "error": "La hora de inicio debe ser menor que la hora de fin."
    }
    ```

  - **409 Conflict (Horario solapado con una reserva existente):**
    ```json
    {
      "error": "El horario seleccionado ya se encuentra reservado."
    }
    ```

---

### 4. Cancelar Reserva

Cancela una reserva existente actualizando su estado a `'cancelada'`.

- **Método:** `DELETE`
- **Ruta:** `/api/reservas/:id`
- **Parámetros de Ruta:**
  - `id`: ID numérico de la reserva (ejemplo: `/api/reservas/1`)

- **Respuestas:**
  - **200 OK (Éxito):**
    ```json
    {
      "id": 1,
      "cliente_nombre": "Carlos López",
      "cliente_email": "carlos@example.com",
      "fecha": "2026-10-20",
      "hora_inicio": "10:00:00",
      "hora_fin": "11:00:00",
      "estado": "cancelada",
      "created_at": "2026-10-14T23:17:40.000Z"
    }
    ```

  - **404 Not Found (Reserva inexistente):**
    ```json
    {
      "error": "Reserva no encontrada."
    }
    ```

---

## 🔒 Lógica de Detección de Conflictos Horarios

Para evitar reservas duplicadas o solapadas, la API ejecuta la siguiente comprobación en Supabase antes de insertar una nueva reserva:

$$\text{hora\_inicio} < \text{nueva\_hora\_fin} \quad \text{AND} \quad \text{hora\_fin} > \text{nueva\_hora\_inicio}$$

Solo se evalúan reservas con `fecha = nueva_fecha` y `estado = 'confirmada'`. De esta manera, los horarios previamente cancelados quedan inmediatamente liberados para nuevos clientes.
