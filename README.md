# Licity — Obras conectadas

Marketplace B2B de licitación de obras: la **PyME** publica su obra, **contratistas verificados** ofertan, la PyME compara y adjudica, sigue el avance y confirma la finalización. Los pagos son **simulados** (registro de prueba, comisión de referencia 1,5 %). Proyecto del Taller Emprendedor (UCAECE Mar del Plata), llevado a la plantilla común **gratis y sin tarjeta**: Vite + React + TypeScript + Tailwind + Firebase (Auth, Firestore con reglas de seguridad, Hosting) en plan **Spark**, sin Cloud Functions ni Storage.

- Sitio publicado (cuando se despliegue): https://licity-ucaecemdp.web.app · Proyecto Firebase: `licity-mdp`

> **Trabajar con una IA / traspaso:** [`CLAUDE.md`](CLAUDE.md) · [`docs/TRABAJAR-CON-IA.md`](docs/TRABAJAR-CON-IA.md) · [`docs/INSTRUCTIVO-SETUP.md`](docs/INSTRUCTIVO-SETUP.md) · [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)

## Qué incluye

| Parte | Ruta | Descripción |
|---|---|---|
| Web pública | `/` | Landing: hero, cómo funciona, beneficios para las dos partes, confianza, modelo de comisión, botones Ingresar / Registrarme. También `/terminos` y `/privacidad` (borradores) |
| App de usuarios | `/app/...` | Registro y login (Google y email/contraseña), sesión persistente, elección del tipo de usuario (PyME / contratista), recuperar contraseña |
| PyME | `/app/pyme/...` | Publica obras (título, tipo, ciudad, presupuesto, plazos), recibe y compara ofertas, evalúa, **adjudica**, sigue el avance, confirma la finalización, cancela, perfil |
| Contratista | `/app/contratista/...` | Se registra y queda **pendiente de verificación**. Una vez aprobado: ve obras abiertas, **oferta**, retira ofertas, gestiona sus trabajos (iniciar, avances, "terminé"), reporta obras, perfil |
| Administración | `/admin/...` | Solo login (sin registro). Usuarios (suspender/reactivar), **verificaciones** (aprobar o rechazar con motivo), obras (moderar, cancelar, resolver reportes) y **pagos/comisiones** (registros de prueba) |

Flujo de una obra: `Publicada → Recibiendo ofertas → En evaluación → Adjudicada → En ejecución → Finalizada` (o `Cancelada`). Al confirmarse la finalización queda un **registro de prueba** del pago con el monto final y la comisión de 1,5 %: no hay pasarela y no se mueve dinero.

## Correrlo en tu computadora (con emuladores, sin tocar producción)

Necesitás [Node.js 20+](https://nodejs.org) y [Java 21+](https://adoptium.net) (los emuladores de Firebase lo usan).

```bash
npm install
npm run emuladores        # terminal 1: emuladores de Auth y Firestore (UI en http://127.0.0.1:4421)
npm run seed              # terminal 2: carga los usuarios y datos DEMO
npm run dev:emulador      # terminal 2: la app en http://localhost:5421
```

Los emuladores empiezan vacíos cada vez que se reinician: volvé a correr `npm run seed`. (Los puertos de Licity son propios —5421, 9421, 8421, 4421— para poder correrlo junto a otras apps de la cátedra.)

### Usuarios de prueba (DEMO, claves públicas, solo existen en los emuladores)

Contraseña de todos: `Demo-Clave-2026`

| Tipo | Email | Estado |
|---|---|---|
| PyME | `pyme.demo@licity.test` | Panadería La Espiga SRL, con obras en distintos estados |
| Contratista verificado | `contratista.demo@licity.test` | puede ofertar; tiene un trabajo en ejecución y uno finalizado |
| Contratista verificado (2) | `contratista2.demo@licity.test` | para comparar ofertas |
| Contratista pendiente | `pendiente.demo@licity.test` | pendiente de verificación: no puede ofertar hasta que el admin lo apruebe |
| Superadmin | `admin.demo@licity.test` | entra en `/admin/login` |

Todos los datos del seed están marcados `isDemo: true` (se ve una etiqueta DEMO). Obras de ejemplo: ampliación de depósito (con 2 ofertas para adjudicar), pintura de local (sin ofertas), reforma de cocina (en ejecución al 40 %) e impermeabilización de techo (finalizada, con su registro de prueba de pago).

> **Login con Google:** no se puede probar contra los emuladores (Google no autentica en local). Se prueba en el sitio publicado. Quien ingresa con Google por primera vez completa el tipo de usuario y los datos de su empresa en `/app/completar-perfil`.

## Variables de entorno

Copiá `.env.example` a `.env` y completá con la config web de Firebase (Consola → Configuración del proyecto → Tus apps). **No son secretos** (van en el navegador), la seguridad la dan las reglas de Firestore. Para el sitio publicado, esos mismos valores van en `.env.production` (este sí se sube a git; ya tiene los de `licity-mdp`).

| Variable | Qué es |
|---|---|
| `VITE_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._APP_ID`, `..._MESSAGING_SENDER_ID` | Config web del proyecto Firebase |
| `VITE_USE_EMULATORS` | `true` solo en `.env.emulador` (ya viene así) |

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev:emulador` | App local contra emuladores |
| `npm run lint` · `npm run build` | Calidad (ESLint, TypeScript estricto, build) |
| `npm run test:reglas` | Tests de las reglas de seguridad (emulador de Firestore) |
| `npm run test:e2e` | Tests de humo con Playwright en móvil y escritorio (emuladores de Auth + Firestore) |
| `npm test` | Los dos anteriores |
| `npm run admin:dar -- email@x.com` | Hace administrador a una cuenta (contra emuladores) |

## Seguridad: cómo está pensada

- **Las reglas de Firestore (`firestore.rules`) son la validación del servidor.** Esconder botones no protege nada: toda lectura y escritura pasa por las reglas. Validan tipos, enums, campos permitidos y dueño.
- **Admin** = *custom claim* `admin: true`. Nadie puede dárselo desde la app; solo se otorga con el script de `firebase-admin` (ver abajo).
- Nadie puede **escalar su rol ni aprobarse solo**: la cuenta de contratista nace con verificación `PENDIENTE` y solo el admin la pasa a `APROBADO`/`RECHAZADO` (con motivo). Un rechazado solo puede volver a pedir la revisión.
- **Las transiciones de estado se validan en las reglas**: p. ej. nadie salta de "Publicada" a "Finalizada"; solo la PyME dueña adjudica o confirma; solo el contratista adjudicado inicia, informa avance (nunca hacia atrás ni al 100 % por esa vía) o marca "terminé"; la finalización exige el "terminé" previo y el registro del pago.
- **Acceso cruzado**: una PyME no ve obras ni ofertas de otra; un contratista no ve las ofertas de otro; un contratista pendiente o rechazado no ve ninguna obra.
- Sin Cloud Functions, las operaciones que tocan varios documentos (ofertar, adjudicar, cancelar, confirmar) se hacen en un *batch* del cliente y las reglas exigen con `getAfter()` que todas las piezas sean consistentes (la oferta aceptada coincide con el contratista y monto de la obra, el pago coincide con el monto adjudicado y la comisión del 1,5 %, etc.).
- Los formularios se validan con **Zod** en el cliente (mensajes claros) y las reglas vuelven a validar.
- Los tests de `tests/rules` (67 casos) cubren escalada de rol, transiciones inválidas, acceso cruzado entre PyMEs y contratistas, pagos y notificaciones.

## Administradores

Los admins no se registran: se les da el permiso a una cuenta existente.

- **Local (emuladores):** `npm run admin:dar -- persona@mail.com`
- **Producción:** GitHub → Actions → **Dar admin** → *Run workflow* → email. La persona primero debe registrarse en la app (o crearse la cuenta en la consola de Firebase) y después **cerrar sesión y volver a entrar**.

Para que el workflow funcione el responsable del proyecto configura **una sola vez**:

1. **Cuenta de servicio con permisos mínimos.** En Google Cloud Console → IAM → *Cuentas de servicio* → crear `admin-dar` con solo estos roles: **Administrador de Firebase Authentication** (`roles/firebaseauth.admin`) y **Usuario de Cloud Datastore** (`roles/datastore.user`, para escribir el perfil en Firestore). Nada más.
2. **Cargar la credencial como secreto:** repo de GitHub → Settings → Secrets and variables → Actions → *New repository secret* → `FIREBASE_ADMIN_SA_JSON` con el contenido del JSON de la clave. Y una *variable* (no secreto) `FIREBASE_PROJECT_ID` con el id del proyecto.
3. **Si la organización no permite crear claves** (política `iam.disableServiceAccountKeyCreation`, común en cuentas institucionales): usar *Workload Identity Federation* — sin claves. En `admin-dar.yml` reemplazar `credentials_json` por `workload_identity_provider` y `service_account` ([guía de `google-github-actions/auth`](https://github.com/google-github-actions/auth#workload-identity-federation)). Si tampoco es posible, otorgar el claim desde una computadora con `npm run admin:dar:prod -- email` usando `gcloud auth application-default login`.

> Nunca subas ni pegues la clave JSON en el repo, en un chat ni en un issue. `.gitignore` ya bloquea los nombres típicos.

## Cómo desplegar (lo hace el responsable del proyecto)

1. El proyecto **`licity-mdp`** ya está creado (plan Spark, Auth con Email/contraseña y Google, Firestore `(default)` en `nam5` en modo producción y Hosting en https://licity-ucaecemdp.web.app). La config web ya está en `.env.production`. **No activar Blaze.**
2. El id del proyecto ya está en `.firebaserc` (`licity-mdp`).
3. Subir las reglas: `npx firebase deploy --only firestore:rules,firestore:indexes` (o `npm run deploy:reglas`).
4. Conectar GitHub ↔ Hosting **una sola vez**: `npx firebase init hosting:github` (crea la cuenta de servicio y carga el secreto `FIREBASE_SERVICE_ACCOUNT_...` en GitHub; **no se crea ni se sube a mano**). Ajustar el nombre del secreto en `.github/workflows/deploy.yml` si hace falta.
5. Desde ahí, **cada merge a `prod` publica la web (y `qa` publica una vista previa)** (`.github/workflows/deploy.yml`). Las reglas se vuelven a desplegar con el paso 3 cuando cambian.
6. En Authentication → Configuración → Dominios autorizados, verificar que figure el dominio `.web.app` del sitio (para el login con Google).

CI (`.github/workflows/ci.yml`): en cada PR corre lint, build, tests de reglas y Playwright contra emuladores.

## Límites del plan Spark (gratis, sin tarjeta)

- **Firestore:** 1 GiB almacenado, 50.000 lecturas y 20.000 escrituras por día (y 20.000 borrados). Las lecturas que hacen las reglas con `get()` también cuentan.
- **Hosting:** 10 GB almacenados y ~360 MB de transferencia por día.
- **Authentication:** email/contraseña y Google sin costo, hasta ~3.000 usuarios activos por día.
- **No hay** Cloud Functions ni Cloud Storage (por eso las imágenes son archivos del propio sitio, en `public/`, o URLs).
- Al llegar al tope diario, Firebase **corta el servicio hasta el día siguiente** (no cobra): por eso no hace falta tarjeta **mientras no activen el plan Blaze**. No lo activen.

## Cómo llevarte este proyecto

Cuando un alumno quiere quedarse con el proyecto:

1. **GitHub:** el dueño actual va a *Settings → General → Danger Zone → Transfer* y transfiere el repo a la cuenta del nuevo responsable (que tiene que aceptar la transferencia por mail).
2. **Firebase:** en la Consola → *Configuración del proyecto → Usuarios y permisos* → *Agregar miembro* → el email del nuevo responsable con rol **Propietario (Owner)**.
3. El nuevo responsable entra, comprueba que ve el proyecto, y recién entonces **la cátedra se quita** de Usuarios y permisos.
4. Volver a correr `firebase init hosting:github` desde su cuenta para que el despliegue automático use su credencial, y revisar los secretos/variables de Actions (`FIREBASE_PROJECT_ID`, etc.).

No hace falta tarjeta de crédito en ningún paso mientras sigan en el plan Spark.

## Estructura

```
src/
  config/app.ts          ← marca, roles, estados de obra/oferta, comisión (lo primero que se cambia)
  styles/tema.css        ← colores (terracota, mostaza, crema, marrón), radio y tipografía (Anton + Inter)
  lib/firebase/          ← inicialización de Firebase (emuladores o producción)
  lib/validations/       ← esquemas Zod (registro, perfiles, obras, ofertas)
  lib/acciones/          ← escrituras a Firestore (batch): pyme.ts, contratista.ts, admin.ts
  auth/                  ← AuthContext, useAuth y guardas RequireAuth / RequireRole / RequireVerificado / RequireAdmin
  components/            ← UI común, layouts, landing (home/), seguimiento, avisos
  pages/public|app|admin ← pantallas (app/pyme, app/contratista)
  hooks/                 ← useColeccion y useDocumento (Firestore en tiempo real)
scripts/                 ← seed.ts, admin-dar.ts
tests/rules, tests/e2e   ← reglas (vitest) y humo (Playwright)
firestore.rules · firestore.indexes.json · firebase.json
.github/workflows/       ← ci.yml, deploy.yml, admin-dar.yml
```

Guía de la plantilla de la que sale este proyecto: [`docs/NUEVA-STARTUP.md`](docs/NUEVA-STARTUP.md).

## Diferencias con la app original (Next.js + Postgres)

Se conservaron diseño, textos, pantallas y funcionalidades. Lo que cambia por el stack gratuito sin servidor:

- **Datos**: Postgres/Drizzle → Firestore. Las reglas de seguridad reemplazan a las *server actions*; las operaciones de varios pasos son batches validados con `getAfter()`.
- **Pagos**: siempre registros de prueba rotulados "Registro de prueba" (la original distinguía "pendiente de pasarela" en datos reales).
- **Verificación del contratista**: el estado vive en la cuenta (`verificacion`: `PENDIENTE`/`APROBADO`/`RECHAZADO` + motivo); no se guarda un historial de solicitudes aparte.
- **Avisos**: se escriben desde el cliente de quien actúa (solo hacia la otra parte de la obra); no hay mails.
- **Obra sin ofertas**: si el contratista retira su única oferta, la obra queda "Recibiendo ofertas" (la original volvía a "Publicada"; sin servidor, solo la PyME y el contratista adjudicado pueden cambiar el estado).
- **Teléfono del contratista adjudicado** y **calificaciones/obras previas**: no se muestran en esta versión (la landing las menciona como parte de la verificación que hace Licity).
- **Recuperar contraseña** usa el mail de Firebase Auth.

## Licencia

Pendiente de definir por la cátedra (ver `LICENSE`).
