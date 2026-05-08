# NEOLINK HUB — B2B Connector Marketplace

NEOLINK HUB es un Marketplace SaaS diseñado para la conexión estructurada entre compradores y vendedores de productos digitales, con un enfoque en la trazabilidad y la moderación inteligente.

## 🚀 Estado Actual: MVP Finalizado (Sprint 1)

El sistema cumple con el alcance solicitado por la dirección, permitiendo:
- **Segmentación de Usuarios:** Roles diferenciados para **Vendedores** (Sellers), **Compradores** (Buyers Tipo 1-5) y **Administradores**.
- **Publicación Moderada:** Sistema de alta de ofertas con validación automática por IA.
- **Trazabilidad de Leads (Core):** Registro automático de accesos a ofertas y envío de propuestas comerciales entre partes.
- **Panel de Control Admin:** Supervisión total de interacciones, usuarios y contenido.

## 🏗️ Arquitectura y Tecnologías

- **Backend:** Node.js (Express) - Arquitectura REST.
- **Seguridad:** Autenticación Nativa (Zero-Deps) con Hashing PBKDF2 y JWT.
- **Persistencia:** PostgreSQL 16 (Relacional).
- **Frontend:** SPA Premium (HTML5/CSS3/JS) con diseño responsive y Glassmorphism.
- **IA (Moderación):** Skill de Python para análisis de contenido en tiempo real.

## 📋 Endpoints Principales

| Método | Endpoint | Función |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Registro con selección de rol (Vendedor/Comprador) |
| `POST` | `/api/v1/opportunities` | Publicación de oferta (Solo Vendedores) |
| `POST` | `/api/v1/interactions` | Registrar acceso o propuesta (Compradores) |
| `GET` | `/api/v1/interactions` | Ver trazabilidad total (Solo Admins) |

## 🛠️ Instalación y Pruebas

1. **DB:** Levantar Postgres en el puerto `5433`.
2. **Server:** `cd services/opportunities && npm run dev`.
3. **Frontend:** Abrir `frontend/index.html`.
4. **Validación:** Seguir los pasos detallados en `CHECKLIST_TESTS.md`.

---
**Contacto Técnico:** Matias M. 
