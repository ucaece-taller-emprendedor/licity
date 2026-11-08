# Armar una startup nueva a partir de la plantilla

Checklist en el orden en que conviene hacerlo. Lo marcado con 🔒 afecta la seguridad: se hace siempre en pareja con las reglas y sus tests.

1. **Identidad** — `src/config/app.ts` (`MARCA`, `LANDING`), `src/styles/tema.css` (colores, radio, fuente), `public/logo.svg` y `public/favicon.svg`, `<title>` en `index.html`.
2. **Roles** 🔒 — `src/config/app.ts`: tipos `Rol`, `ROLES_REGISTRABLES` (cuáles se eligen al registrarse y si requieren aprobación) y `panelDe`. Los mismos nombres hay que usarlos en `firestore.rules` (función `users`, regla `create`) y en `src/router.tsx`.
3. **Datos** 🔒 — la colección de ejemplo `items` se reemplaza por las de la startup: esquema Zod en `src/lib/validations/`, reglas en `firestore.rules` (validar tipos, enums, campos permitidos y dueño) y tests en `tests/rules/`.
4. **Pantallas** — `src/pages/app/Paneles.tsx` (paneles por rol) y `src/pages/admin/AdminPaginas.tsx`; rutas en `src/router.tsx`.
5. **Seed demo** — `scripts/seed.ts`: un usuario por rol (+ un pendiente) y datos de ejemplo, todo con `isDemo: true`.
6. **Proyecto Firebase** — crear proyecto (Spark), cambiar `.firebaserc`, `PROYECTO_EMULADOR` en `scripts/lib/admin-sdk.ts`, `--project demo-...` en los scripts de `package.json`, y `.env.production`.
7. **Tests** — ajustar `tests/e2e/humo.spec.ts` a los textos y rutas nuevos.
8. **README y LICENSE** — nombre, usuarios de prueba, enlaces.

Antes de cada PR: `npm run lint && npm run build && npm test`.
