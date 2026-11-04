# Licity

Marketplace B2B de licitación de obras: la PyME publica su obra, los contratistas ofertan y se paga por etapas con fondos protegidos. Roles: PyME, contratista y superadmin.

> Proyecto del **Taller Emprendedor** · Universidad CAECE (Mar del Plata) · cohorte 2026 2C.
> Docentes: Franco Vinciguerra y Luis Orviz Friser.

## El problema

Las PyMEs no tienen una forma ordenada y segura de licitar obras, y los contratistas no tienen visibilidad de las oportunidades.

## Equipo

- [levnatashaa-ux](https://github.com/levnatashaa-ux)

## Demo

[https://licity-mu.vercel.app](https://licity-mu.vercel.app)

> La demo corre en el plan gratuito de Vercel, que es solo para uso personal y no comercial. Alcanza para esta demo académica con datos de ejemplo.

## Cómo funciona (3 niveles de acceso)

| Nivel | Ruta | Quién entra |
| --- | --- | --- |
| Landing pública | `/` | Cualquiera. Botones **Ingresar** y **Registrarme**. |
| App de usuarios | `/app/...` | **PyME** (`/app/pyme`) y **contratista** (`/app/contratista`). Registro y login con Google o con correo y contraseña. |
| Administración | `/admin/...` | Solo **superadmin**. Login propio (`/admin/ingresar`), **sin registro público**. |

- El contratista se registra en `/app` y queda **pendiente de verificación** hasta que un admin lo aprueba; hasta entonces no puede ofertar.
- Con Google, un usuario nuevo elige primero si es PyME o contratista (`/app/tipo`) antes de entrar al panel.
- El rol se valida **en el servidor** en cada layout (`requireRole`) y en cada server action (`requireRoleForAction`), además del `proxy.ts` que corta el acceso sin sesión.
- Los **pagos son simulados**: se guarda un "Registro de prueba" con la comisión de Licity (1,5 %). No hay pasarela de pago integrada.
- Las rutas viejas (`/ingresar`, `/registro`, `/client`, `/business`, `/entrar`) redirigen a las nuevas.

## Cómo correrla en local

Necesitás Node.js 20+ y una base Postgres (podés crear una gratis en [Neon](https://neon.tech) o usar una local).

```bash
cp .env.example .env     # completá las variables (ver abajo)
npm install
npm run db:migrate       # aplica las migraciones versionadas (drizzle-kit)
npm run db:seed          # opcional: datos de demostración (isDemo)
npm run dev
```

La app queda en http://localhost:3000.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, build y servidor de producción |
| `npm run lint` / `typecheck` | ESLint y TypeScript estricto |
| `npm run db:generate` | Genera una migración nueva a partir de `lib/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:seed` | Borra y recrea los datos de demo (idempotente) |
| `npm run test:e2e` | Tests de humo con Playwright (necesita migraciones + seed) |

La primera vez: `npx playwright install chromium`.

### Variables de entorno

Se validan al arrancar (`lib/env.ts`): si falta alguna, el error dice cuál. Están documentadas en [`.env.example`](.env.example).

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión a Postgres |
| `BETTER_AUTH_SECRET` | Sí | Secreto de sesiones (mín. 32 caracteres: `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Sí | URL pública de la app (`http://localhost:3000` en local) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Habilitan el ingreso con Google. Sin ellas, el botón queda deshabilitado con un aviso |
| `ADMIN_EMAILS` | No | Correos (separados por coma) que reciben el rol superadmin al ingresar con Google con correo verificado |

### Ingreso con Google

1. En Google Cloud Console creá un cliente OAuth "Aplicación web".
2. Cargá estas URI de redirección autorizadas:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://<tu-dominio>/api/auth/callback/google`
3. Completá `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

## Usuarios de prueba por rol

Los crea `npm run db:seed` y están marcados como **demo** (`isDemo`). Son datos de ejemplo, no reales. La clave es pública, así que **no corras el seed en una base real** sin borrar o cambiar estas cuentas después.

| Rol | Correo | Clave | Entra a |
| --- | --- | --- | --- |
| PyME | `pyme@licity.demo` | `Licity-Demo-2026` | `/app/ingresar` |
| Contratista verificado | `contratista@licity.demo` | `Licity-Demo-2026` | `/app/ingresar` |
| Contratista verificado (2) | `contratista2@licity.demo` | `Licity-Demo-2026` | `/app/ingresar` |
| Contratista pendiente de verificación | `pendiente@licity.demo` | `Licity-Demo-2026` | `/app/ingresar` |
| Superadmin | `admin@licity.demo` | `Licity-Demo-2026` | `/admin/ingresar` |

El seed también crea obras de ejemplo en cada estado: publicada, recibiendo ofertas (con dos ofertas para comparar y adjudicar), en ejecución y finalizada (con su registro de pago de prueba).

## Estructura

```
app/(public)/     landing, términos y privacidad  (/)
app/(app)/app/    app de usuarios                 (/app: auth, /pyme, /contratista)
app/admin/        panel de administración         (/admin)
lib/auth/         Better Auth, sesión y requireRole
lib/db/           esquema Drizzle, migraciones, seed
lib/validations/  esquemas Zod
lib/actions/      server actions (validan rol y datos en el servidor)
components/       UI compartida
tests/e2e/        Playwright
```

## Calidad

Un GitHub Action (`.github/workflows/ci.yml`) corre lint, typecheck, build y los tests de humo en cada push y PR.

## Cómo llevarte este proyecto

1. Creá tu propia organización de GitHub.
2. Como Admin del repo, transferilo: **Settings → Danger Zone → Transfer**. Se conservan el historial, los issues y las estrellas, y los links viejos redirigen.
3. Creá tus propias cuentas de Vercel, Neon y el cliente OAuth de Google.
4. Copiá `.env.example` a `.env`, completá tus valores, corré `npm run db:migrate` y desplegá.
5. Los usuarios de demo no se migran: la base de producción arranca de cero (no corras `db:seed` en producción).

## Licencia

Pendiente de definir por la cátedra. Ver [LICENSE](LICENSE).
