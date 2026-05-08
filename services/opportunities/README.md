# opportunities-service

Microservicio de gestión de oportunidades de productos digitales para **NEOLINK HUB** — Marketplace B2B.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/health` | Health check del servicio |
| `POST` | `/api/v1/opportunities` | Crear nueva oportunidad |

---

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL
```

### 3. Aplicar la migración de base de datos

```bash
psql $DATABASE_URL -f src/db/migrations/001_create_opportunities.sql
```

### 4. Arrancar el servidor en modo desarrollo

```bash
npm run dev
```

El servicio estará disponible en `http://localhost:3001`.

---

## Uso del endpoint `POST /api/v1/opportunities`

### Request

```http
POST /api/v1/opportunities
Content-Type: application/json

{
  "title":         "API de Análisis de Sentimientos v2.0",
  "description":   "API REST que procesa texto en tiempo real para detectar polaridad emocional con un 94% de precisión. Incluye SDK para Node.js y Python, documentación OpenAPI 3.0 y SLA del 99.9%.",
  "category":      "artificial-intelligence",
  "price":         299.00,
  "currency":      "USD",
  "billing_cycle": "monthly",
  "vendor_id":     "vendor_8f3a2c",
  "tags":          ["nlp", "api", "saas"]
}
```

### Response 201 — Aprobado

```json
{
  "status": "success",
  "message": "Opportunity created and approved by the marketplace moderator.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "API de Análisis de Sentimientos v2.0",
    "moderation_status": "approved",
    "created_at": "2026-05-06T21:00:00.000Z"
  }
}
```

### Response 400 — Moderación fallida

```json
{
  "status": "error",
  "code":   "MODERATION_FAILED",
  "message": "The listing did not pass marketplace moderation.",
  "details": [
    "'description' no puede estar vacía.",
    "'price' debe ser mayor a 0 o el campo 'is_free' debe ser true."
  ]
}
```

---

## Integración con marketplace-moderator skill

Antes de persistir cualquier oportunidad, el servicio ejecuta:

```bash
python3 agent/skills/marketplace-moderator/scripts/validate_listing.py '<JSON>'
```

- **Exit `0`** → Oportunidad aprobada, se guarda en la base de datos.
- **Exit `1`** → El API retorna `400 Bad Request` con los detalles del error.

La ruta al script se configura mediante la variable de entorno `SKILL_VALIDATOR_PATH`.

---

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto del servidor HTTP |
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PGHOST` | `localhost` | Host de PostgreSQL |
| `PGPORT` | `5432` | Puerto de PostgreSQL |
| `PGDATABASE` | `neolink_hub` | Nombre de la base de datos |
| `PGUSER` | `neolink` | Usuario de PostgreSQL |
| `PGPASSWORD` | `` | Contraseña de PostgreSQL |
| `SKILL_VALIDATOR_PATH` | `agent/skills/marketplace-moderator/scripts/validate_listing.py` | Ruta al validador Python |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Ventana del rate limiter (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Máximo de requests por ventana |
