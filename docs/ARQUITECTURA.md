# Arquitectura de Licity

## Zonas de la app
| Zona | Ruta | Quién entra | Notas |
|---|---|---|---|
| Landing | `/` | todos | problema, solución, beneficios, llamado a la acción, botones Ingresar / Registrarme |
| App | `/app/...` | usuarios registrados | mobile first; Google + email/contraseña; sesión persistente; elección de tipo de usuario |
| Admin | `/admin/...` | solo admins | login sin registro; pantallas: resumen, usuarios, **administradores**, y las propias de la startup |

## Mapa de archivos
```
src/
  config/app.ts          marca, roles, textos de la landing (lo primero que se cambia)
  styles/tema.css        colores, radio, tipografía
  router.tsx             todas las rutas y qué rol puede ver cada una
  auth/                  AuthContext (sesión y perfil), guards (RequireAuth/RequireRole/RequireAdmin)
  components/            UI común, layouts, RecuperarClave (olvidé / cambiar contraseña)
  pages/public|app|admin pantallas
  lib/firebase/          inicialización (emuladores o producción)
  lib/validations/       esquemas Zod
  hooks/useColeccion.ts  lecturas en tiempo real de Firestore
firestore.rules          LA validación del servidor (qué puede leer/escribir cada quién)
tests/rules              tests de las reglas (emulador)
tests/e2e                flujos completos con Playwright
scripts/                 seed.ts (datos demo), admin-dar.ts (admin por claim), lib/admin-sdk.ts
.github/workflows        ci.yml (calidad), deploy.yml (publica), admin-dar.yml (dar admin)
docs/                    esta documentación
```

## Datos
Colecciones: users, perfiles, obras, novedades, ofertas, pagos, notificaciones. Cada documento de `users/{uid}` tiene `role`, `status` (`activo` / `pendiente` / `suspendido`), `email`, `displayName`, `isDemo`. Las reglas impiden que alguien se cambie su propio rol o estado.

## Seguridad en una página
- Las reglas de Firestore se evalúan en los servidores de Google en cada lectura/escritura. Esconder un botón **no** protege nada.
- Registro: solo se pueden crear perfiles con roles registrables; los que requieren aprobación nacen `pendiente`.
- Admin: claim `admin: true` (cátedra, vía script) o `role: 'admin'` en el perfil, que solo otro admin puede escribir y solo sobre una persona **activa** distinta de sí mismo.
- Los tests de `tests/rules` cubren escalada de rol, lecturas ajenas, estados pendientes, etc.

## Entornos y ramas
| Rama | Qué es | Qué pasa al hacer push/merge |
|---|---|---|
| `prod` | lo que ve el público | se publica en https://licity-mdp.web.app (Hosting + reglas) |
| `qa` | integración y revisión | se publica una **vista previa** (canal `qa`, URL en el log del workflow) |
| `feature/*` | trabajo de cada cambio | corre CI en el PR |

Aviso: `qa` y `prod` comparten el mismo proyecto Firebase (misma base de datos). La vista previa sirve para revisar pantallas; probar flujos que escriben datos con los emuladores (`npm run dev:emulador`).

## Límites del plan Spark
Firestore 1 GiB, 50.000 lecturas / 20.000 escrituras por día; Hosting 10 GB y ~360 MB/día; Auth ~3.000 usuarios activos/día. Sin Functions ni Storage. Al llegar al tope, Firebase corta hasta el día siguiente (no cobra).
