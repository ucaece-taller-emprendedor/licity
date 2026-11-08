# Licity — guía para la IA (leer primero)

Este repositorio es **Licity**: licitaciones de obra entre PyMEs y contratistas. Lo hicieron estudiantes del Taller Emprendedor (UCAECE Mar del Plata). **Las personas dueñas del proyecto no son técnicas**: la IA hace el trabajo de programación y tiene que explicarles todo en lenguaje simple, en español rioplatense, sin jerga (si hay que usar un término técnico, explicarlo en una línea).

Sitio en producción: https://licity-mdp.web.app · Proyecto Firebase: `licity-mdp` · Plan **Spark** (gratis, sin tarjeta).

## Reglas de oro (no negociables)
1. **Nunca** subir secretos, claves JSON, contraseñas ni tokens al repositorio ni pegarlos en chats o issues. La config web de Firebase (`.env.production`) es pública; todo lo demás no.
2. **No activar el plan Blaze, Cloud Functions ni Cloud Storage.** Todo se resuelve en el navegador + reglas de Firestore. Si un pedido lo necesita, explicar la limitación y proponer una alternativa gratuita.
3. **La seguridad vive en `firestore.rules`**, no en los botones. Todo cambio de datos o roles se hace *junto* con su regla y su test en `tests/rules/`. Nunca ablandar una regla para "que ande": se arregla el código.
4. **No trabajar directo sobre `prod`.** Se crea una rama `feature/<tema>` desde `qa`, se abre un PR hacia `qa`, se revisa la vista previa, y recién después se hace un PR `qa` → `prod` (que publica el sitio).
5. Antes de pedir revisión: `npm run lint && npm run build && npm test` tienen que pasar. No borrar ni saltear tests para que pasen.
6. No inventar datos reales de personas. Los datos de ejemplo llevan `isDemo: true` y se ven marcados como DEMO.
7. Ante la duda sobre algo que **no se puede deshacer** (borrar datos de producción, cambiar quién es admin, cambiar reglas), parar y preguntar a la persona.

## Cómo está armado
- **Vite + React + TypeScript estricto + Tailwind + React Router.** Una sola app con tres zonas: `/` (landing pública, responsive), `/app/...` (usuarios, mobile first), `/admin/...` (solo login, sin registro).
- **Firebase:** Auth (email/contraseña y Google), Firestore (con reglas), Hosting. Validación de formularios con Zod.
- Roles: pyme (activa), contratista (pendiente de verificación por el admin), admin.
- Colecciones de Firestore: users, perfiles, obras, novedades, ofertas, pagos, notificaciones.
- Admin = custom claim `admin: true` (admins iniciales de la cátedra) **o** `role: 'admin'` en `users/{uid}` (lo da otro admin desde `/admin/administradores`). Una persona debe registrarse antes de poder ser admin.
- Detalle y mapa de archivos: `docs/ARQUITECTURA.md`.

## Comandos
| Comando | Para qué |
|---|---|
| `npm install` | Instalar dependencias (una vez) |
| `npm run emuladores` + `npm run seed` + `npm run dev:emulador` | Probar local con datos demo, sin tocar producción |
| `npm run lint` · `npm run build` | Calidad y compilación |
| `npm run test:reglas` · `npm run test:e2e` · `npm test` | Tests (necesitan Java 21 para los emuladores) |
| `npm run deploy:reglas` | Publicar reglas de Firestore (solo con permiso de la persona; el deploy normal lo hace GitHub al mergear a `prod`) |

## Cómo encarar un pedido (método de trabajo)
1. **Entender:** repetir el pedido en una frase y preguntar lo que falte (¿para qué tipo de usuario? ¿qué debería pasar si sale mal?).
2. **Plan corto** en lenguaje simple: qué pantallas/archivos se tocan y si afecta la seguridad. Esperar el OK si el cambio es grande o toca reglas/roles.
3. **Rama** `feature/<tema>` desde `qa` actualizada.
4. **Implementar** siguiendo las convenciones de abajo; reglas + tests si hay datos o permisos nuevos.
5. **Verificar** con `npm run lint && npm run build && npm test`. Si algo falla, arreglar la causa.
6. **PR hacia `qa`** con: qué cambió, por qué, cómo probarlo y capturas si hay pantallas. Explicarle a la persona qué ver en la vista previa.
7. **Pasar a producción** solo cuando la persona confirme: PR `qa` → `prod`. Después del deploy, comprobar el sitio en https://licity-mdp.web.app.

## Convenciones
- Textos en **español rioplatense** (vos, "Ingresá", "Registrate"). Mensajes de error claros y sin tecnicismos.
- **Mobile first**: probar en ancho 375 px antes que en escritorio. Botones/campos de al menos 44 px de alto.
- Marca y landing se cambian en `src/config/app.ts` y `src/styles/tema.css`. Rutas en `src/router.tsx`.
- Componentes de UI comunes en `src/components/ui.tsx`; no duplicar estilos.
- Formularios: esquema Zod en `src/lib/validations/` + `validarFormulario`. Accesibilidad: etiquetas en todos los campos, `alt` en imágenes, foco visible.
- Cada pantalla nueva necesita un test de humo en `tests/e2e/humo.spec.ts` si es parte de un flujo principal.
- Commits chicos y en español, que expliquen el *por qué*.

## Qué NO tocar sin hablar con la persona
`firestore.rules` (sí se puede editar, pero siempre con tests y aviso), `.firebaserc`, `.env.production`, `.github/workflows/`, quién es admin, y cualquier dato de producción.

## Si algo no anda
Primero reproducir (local con emuladores). Para errores del sitio publicado, mirar la consola del navegador y la pestaña Firestore → Reglas → "Simulador". Si el sitio deja de responder un día, puede ser el tope diario del plan gratis (50.000 lecturas / 20.000 escrituras): se reinicia solo al día siguiente.
