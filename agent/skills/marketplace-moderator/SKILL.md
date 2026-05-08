# Skill: Marketplace Moderator

## Descripción

Valida y modera automáticamente nuevas oportunidades de productos digitales.

Esta skill actúa como la primera línea de defensa del marketplace NEOLINK HUB. Antes de que cualquier listado de producto digital sea publicado, esta skill lo analiza, verifica su integridad estructural, y determina si cumple con los estándares de calidad y las políticas de la plataforma B2B.

---

## Herramienta: validate_listing

Para validar un listado, ejecuta el siguiente script de Python pasándole el JSON del listado como argumento:

```bash
python scripts/validate_listing.py '<listing_json>'
```

- **Exit code `0`**: El listado es **válido** y puede ser publicado.
- **Exit code `1`**: El listado es **inválido**. Revisa el mensaje de error en `stderr` para obtener el motivo del rechazo.

### Cuándo invocar esta herramienta

Invoca `validate_listing.py` cada vez que:
- Un vendedor envíe un nuevo listado a través de `POST /api/v1/listings`.
- Un listado existente sea actualizado con cambios en campos críticos (`title`, `price`, `category`, `description`).
- Se realice una revisión manual solicitada por un moderador humano.

---

## Few-Shot Learning: Ejemplos de Moderación

A continuación se presentan ejemplos que definen el criterio de evaluación que debes aplicar.

---

### ✅ Ejemplo 1: Listado VÁLIDO — Herramienta SaaS bien definida

**Input (listado enviado por el vendedor):**
```json
{
  "title": "API de Análisis de Sentimientos v2.0",
  "description": "API REST que procesa texto en tiempo real para detectar polaridad emocional (positivo, negativo, neutro) con un 94% de precisión. Incluye SDK para Node.js y Python, documentación OpenAPI 3.0, SLA del 99.9% y soporte técnico dedicado. Ideal para equipos de CX y marketing B2B.",
  "category": "artificial-intelligence",
  "price": 299.00,
  "currency": "USD",
  "billing_cycle": "monthly",
  "vendor_id": "vendor_8f3a2c",
  "tags": ["nlp", "api", "saas", "sentiment-analysis"]
}
```

**Razonamiento:**
- ✅ `title`: Específico, con versión, sin spam.
- ✅ `description`: Supera los 100 caracteres, explica el valor concreto (94% precisión, SLA 99.9%), incluye casos de uso B2B.
- ✅ `price`: Mayor a 0, numérico, dentro de rango razonable.
- ✅ `category`: Valor perteneciente a la lista de categorías permitidas.
- ✅ `billing_cycle`: Valor válido (`monthly`).
- ✅ `vendor_id`: Presente y no vacío.

**Acción:** `APPROVE` — Publicar el listado.

---

### ❌ Ejemplo 2: Listado INVÁLIDO — Precio en cero y descripción vacía

**Input (listado enviado por el vendedor):**
```json
{
  "title": "Plugin de Facturación Electrónica",
  "description": "",
  "category": "fintech",
  "price": 0,
  "currency": "USD",
  "billing_cycle": "monthly",
  "vendor_id": "vendor_1a9b4d"
}
```

**Razonamiento:**
- ❌ `description`: Está vacía. Un producto digital B2B debe describir su valor de forma clara.
- ❌ `price`: Es `0`. Los productos gratuitos requieren el flag explícito `"is_free": true`; de lo contrario se asume un error de datos.

**Acción:** `REJECT` — Retornar error con mensaje:
```
VALIDATION_ERROR: 'description' no puede estar vacía. 'price' debe ser mayor a 0 o el campo 'is_free' debe ser true.
```

---

### ❌ Ejemplo 3: Listado INVÁLIDO — Categoría no permitida y título con spam

**Input (listado enviado por el vendedor):**
```json
{
  "title": "GANA DINERO FÁCIL!!! El mejor software del mundo $$$$",
  "description": "Software que te hace ganar dinero de forma automática sin esfuerzo. Resultados garantizados al 1000%. Compra ya.",
  "category": "get-rich-quick",
  "price": 49.99,
  "currency": "USD",
  "billing_cycle": "one-time",
  "vendor_id": "vendor_zz9921"
}
```

**Razonamiento:**
- ❌ `title`: Contiene signos de exclamación excesivos, caracteres de spam (`$$$`) y lenguaje clickbait. Viola la política de títulos.
- ❌ `description`: Contiene afirmaciones no verificables ("1000% garantizado"), lenguaje de alta presión y no aporta valor técnico real.
- ❌ `category`: `"get-rich-quick"` no existe en la taxonomía de categorías permitidas del marketplace.

**Acción:** `REJECT` — Retornar error con mensaje:
```
VALIDATION_ERROR: 'title' contiene contenido de spam o clickbait. 'description' contiene afirmaciones no verificables. 'category' con valor 'get-rich-quick' no está en la lista de categorías permitidas.
```

---

### ✅ Ejemplo 4: Listado VÁLIDO — Producto de datos con precio único

**Input (listado enviado por el vendedor):**
```json
{
  "title": "Dataset de Empresas LATAM — Q1 2026",
  "description": "Conjunto de datos estructurado con 50.000 registros de empresas de América Latina. Incluye razón social, sector industrial (NAICS), ingresos anuales estimados, tamaño de empleados y país. Formato CSV y Parquet. Actualización trimestral garantizada. Ideal para equipos de ventas B2B e inteligencia de mercado.",
  "category": "data-intelligence",
  "price": 1200.00,
  "currency": "USD",
  "billing_cycle": "one-time",
  "is_free": false,
  "vendor_id": "vendor_c77e01",
  "tags": ["dataset", "latam", "b2b", "market-intelligence"]
}
```

**Razonamiento:**
- ✅ `title`: Descriptivo, con período temporal claro.
- ✅ `description`: Detalla volumen de datos (50k registros), formatos, frecuencia de actualización y caso de uso.
- ✅ `price`: Valor positivo, acorde al tipo de producto (dataset empresarial premium).
- ✅ `billing_cycle`: `"one-time"` es un valor válido para datasets.
- ✅ `category`: `"data-intelligence"` está en la taxonomía permitida.

**Acción:** `APPROVE` — Publicar el listado.

---

## Campos Requeridos y Reglas de Validación

| Campo          | Tipo      | Regla                                                                                   |
|----------------|-----------|-----------------------------------------------------------------------------------------|
| `title`        | `string`  | Entre 10 y 100 caracteres. Sin spam, clickbait ni caracteres repetidos.                 |
| `description`  | `string`  | Mínimo 100 caracteres. Debe describir valor concreto y caso de uso.                     |
| `category`     | `string`  | Debe pertenecer a la lista de categorías permitidas del sistema.                        |
| `price`        | `number`  | Mayor a 0, salvo que `is_free: true` esté explícitamente definido.                      |
| `currency`     | `string`  | Valor ISO 4217 válido (ej: `USD`, `EUR`, `COP`).                                        |
| `billing_cycle`| `string`  | Uno de: `monthly`, `annual`, `one-time`, `usage-based`.                                 |
| `vendor_id`    | `string`  | Presente y no vacío. Debe referenciar un vendor activo en el sistema.                   |
| `tags`         | `array`   | Opcional. Máximo 10 tags. Cada tag: solo minúsculas, guiones y alfanuméricos.           |

---

## Comportamiento Esperado del Agente

1. **Recibir** el payload JSON del listado.
2. **Invocar** `python scripts/validate_listing.py '<listing_json>'`.
3. **Evaluar** el exit code:
   - Si `0` → Responder con `APPROVE` y un resumen positivo del listado.
   - Si `1` → Responder con `REJECT`, mostrar el error de `stderr` y sugerir correcciones específicas al vendedor.
4. **Nunca** publicar un listado sin pasar primero por esta validación.
5. **Registrar** toda decisión de moderación en el log de auditoría.
