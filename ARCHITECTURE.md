# Arquitectura de NEOLINK HUB

## Flujo de Datos General

El siguiente diagrama muestra cómo interactúan los componentes desde que un usuario se registra hasta que publica un producto moderado por IA.

```mermaid
sequenceDiagram
    participant U as Usuario (Navegador)
    participant B as Backend (Node.js)
    participant D as DB (PostgreSQL)
    participant P as Skill IA (Python)

    Note over U,D: Fase 1: Autenticación
    U->>B: POST /auth/register (Datos Usuario)
    B->>D: INSERT INTO users (Hashed Password)
    D-->>B: User OK
    B-->>U: Registro Exitoso

    Note over U,D: Fase 2: Publicación y Moderación
    U->>B: POST /opportunities (JWT + Producto)
    B->>P: Ejecuta validate_listing.py (Few-shot)
    P-->>B: Resultado (Aprobado/Rechazado)
    
    alt Aprobado
        B->>D: INSERT INTO opportunities
        D-->>B: Success (UUID)
        B-->>U: 201 Created (Visualizar en Explorer)
    else Rechazado
        B-->>U: 400 Bad Request (Detalles de Moderación)
    end

    Note over U,D: Fase 3: Exploración
    U->>B: GET /opportunities
    B->>D: SELECT * FROM opportunities WHERE status='approved'
    D-->>B: Listado de productos
    B-->>U: JSON (Visualización en Cards)
```

## Componentes Clave

### 1. Sistema de Autenticación "Zero-Dep"
Para maximizar la portabilidad en entornos restringidos, implementamos un sistema de Auth nativo:
- **Hashing:** PBKDF2 (Password-Based Key Derivation Function 2).
- **Tokens:** JWT personalizado usando `crypto.createHmac`.

### 2. Moderación Inteligente
El motor de moderación en Python utiliza lógica de negocio avanzada y patrones de IA para validar:
- Longitud de descripción mínima (100 chars).
- Taxonomía de categorías permitidas.
- Detección de spam (clickbait, exceso de símbolos).
- Validación de precios B2B.

### 3. Frontend Glassmorphism
Interfaz moderna diseñada para una experiencia de usuario fluida sin frameworks pesados, utilizando CSS dinámico y Modales para la gestión de detalles.
