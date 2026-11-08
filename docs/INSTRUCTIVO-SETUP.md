# Instructivo de setup y traspaso — Licity

Documento para quedarse con el proyecto y manejarlo solos. Todo es **gratuito y sin tarjeta**.

## 1. Qué hay y dónde vive
| Pieza | Dónde | Quién la administra |
|---|---|---|
| Código | GitHub: `ucaece-taller-emprendedor/licity` (ramas `prod`, `qa`) | equipo (rol Admin del repo) |
| Sitio web | Firebase Hosting: https://licity-ucaecemdp.web.app | dueños del proyecto Firebase |
| Base de datos y usuarios | Firebase `licity-mdp` (Firestore + Authentication) | dueños del proyecto Firebase |
| Despliegue automático | GitHub Actions (`.github/workflows`) | se activa solo al mergear a `prod` / `qa` |

## 2. Primeros pasos del equipo
1. **Aceptar la invitación** al repositorio de GitHub (llega por mail).
2. **Pedir/aceptar el rol Propietario** en el proyecto Firebase (Consola de Firebase → ⚙ Configuración del proyecto → Usuarios y permisos): se necesita el mail de Google de cada responsable.
3. Entrar a https://licity-ucaecemdp.web.app/admin/login con la cuenta de admin que se les entregó por separado, y **cambiar la contraseña** (botón "Cambiar mi contraseña").
4. Sumar a otras personas como admin: ver `docs/TRABAJAR-CON-IA.md` → "Dar acceso de admin".

## 3. Trabajar en local (opcional, lo puede hacer la IA)
```bash
npm install
npm run emuladores     # terminal 1
npm run seed           # terminal 2: datos demo
npm run dev:emulador   # terminal 2: http://localhost:5180
```
Usuarios demo (solo en local), contraseña `Demo-Clave-2026`: ver el `README.md`.

## 4. Despliegue
- Push/merge a **`prod`** → GitHub publica Hosting y las reglas de Firestore.
- Push/merge a **`qa`** → vista previa en un canal de Hosting (30 días).
- Requiere el secreto de GitHub `FIREBASE_SERVICE_ACCOUNT` (ya cargado por la cátedra). Si hay que regenerarlo: Consola de Google Cloud → IAM → Cuentas de servicio → `github-deploy` → Claves → nueva clave JSON → pegarla como secreto del repo (Settings → Secrets and variables → Actions) y **borrar el archivo descargado**.

## 5. Mails a usuarios
Hoy el sistema envía por Firebase los mails de **recuperar contraseña**, con el nombre y los textos de Licity. Mails de bienvenida o notificaciones por evento requieren un servicio externo (p. ej. Resend, plan gratis) o Cloud Functions (plan Blaze, con tarjeta); no están activados para mantener el costo en cero.

## 6. Contraseñas y claves: reglas
- Las cuentas de admin entregadas tienen contraseña inicial: **cambiarla en el primer ingreso**.
- Nunca guardar claves en el repositorio. La clave JSON de la cuenta de servicio solo vive como secreto de GitHub.
- Si alguien deja el equipo: quitarlo de Usuarios y permisos de Firebase, del repo y de `/admin/administradores`.

## 7. Qué NO hacer
No activar el plan Blaze ni cargar tarjetas. No borrar el proyecto Firebase ni el repo. No editar reglas de Firestore sin tests.

## 8. Límites del plan gratuito
Firestore 1 GiB y 50.000 lecturas / 20.000 escrituras por día; Hosting 10 GB y ~360 MB/día; Auth ~3.000 usuarios activos/día. Si se superan, el servicio se corta hasta el día siguiente (no se cobra).

## 9. Llevarte el proyecto a tu cuenta
1. GitHub: Settings → General → Danger Zone → *Transfer ownership*.
2. Firebase: agregar tu mail como Propietario; cuando confirmes que ves todo, la cátedra se retira.
3. Reconfigurar el secreto `FIREBASE_SERVICE_ACCOUNT` desde tu cuenta si querés.
