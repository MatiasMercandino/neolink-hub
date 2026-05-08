# Checklist de Pruebas: MVP NEOLINK HUB

Este documento describe los pasos para validar el flujo completo del Marketplace según los requisitos del Alcance Inmediato.

## 1. Gestión de Usuarios
- [ ] **Registro:** Crear una cuenta nueva desde el botón "Registrarse".
- [ ] **Login:** Iniciar sesión con las credenciales creadas.
- [ ] **Persistencia:** Al recargar la página (`F5`), la sesión debe mantenerse activa.
- [ ] **Roles:** 
    - El usuario normal solo ve "📦 Mis Productos".
    - El usuario administrador (configurado en DB) ve además el botón "🛡️ Admin".

## 2. Publicación y Moderación Automática
- [ ] **Flujo de Éxito:** 
    - Publicar un producto con título descriptivo y más de 100 caracteres.
    - El sistema debe aprobarlo automáticamente y mostrarlo en el "Marketplace Explorer".
- [ ] **Flujo de Rechazo (IA):**
    - Intentar publicar con un título como `¡¡¡GANAR DINERO!!!` o descripción muy corta.
    - El sistema debe mostrar un error de moderación y no publicarlo.
- [ ] **Restricción de Anonimato:**
    - Intentar publicar sin estar logueado. El sistema debe abrir el modal de Login.

## 3. Panel de Usuario (Vendedor)
- [ ] **Mis Productos:** Entrar a "📦 Mis Productos" y ver la lista de lo que has publicado.
- [ ] **Estados:** Verificar que el estado (approved/rejected) coincida con la decisión de la IA.
- [ ] **Eliminación:** Borrar un producto propio y verificar que desaparezca tanto del panel como del Explorer.

## 4. Panel de Administración
- [ ] **Visibilidad Total:** Como Admin, entrar a "🛡️ Admin" y ver todas las publicaciones de todos los usuarios.
- [ ] **Moderación Manual:** 
    - Ubicar un producto (ej. uno rechazado por error).
    - Hacer clic en "Aprobar".
    - Verificar que el producto ahora aparezca como aprobado en el Marketplace.
- [ ] **Gestión de Contenido:** Eliminar cualquier producto ofensivo o duplicado desde el panel.

## 5. Visualización de Detalles
- [ ] **Ficha de Producto:** Hacer clic en una tarjeta del Marketplace y ver el modal con la descripción completa y el precio.

---
**Resultado Esperado:** Todas las pruebas deben pasar para considerar el MVP como "Listo para Producción".
