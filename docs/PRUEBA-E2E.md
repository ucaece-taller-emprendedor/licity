# Prueba E2E en producción — Licity

Probado el **2026-11-08** en https://licity-ucaecemdp.web.app con un navegador real (Chromium), en celular (390 px) y escritorio. Se usó una cuenta de prueba de admin y un usuario nuevo registrado para la prueba (**ya borrado**).

## Resultado

| Flujo | Qué se comprobó |
|---|---|
| ✅ landing móvil | carga y muestra el título |
| ✅ olvidé mi contraseña | el formulario aparece |
| ✅ registro | usuario nuevo llega a /app/pyme |
| ✅ sesión persistente | tras recargar sigue dentro |
| ✅ landing escritorio | carga |
| ✅ login admin | cuenta de prueba entra a /admin |
| ✅ administradores | el usuario recién registrado aparece con "Hacer admin" |
| ✅ usuarios | lista cargada |

Además, en cada cambio corre una **suite automática** (GitHub Actions, `npm test`) con los flujos propios de Licity (obras, ofertas y verificaciones), las reglas de seguridad y estos mismos pasos contra emuladores de Firebase.

**No se probó** (limitaciones): el login con Google en producción por esta vía automática; el envío real de mails ("Olvidé mi contraseña" se probó hasta el formulario; hay que confirmar la recepción con una cuenta propia).

## Capturas

**Landing en el celular**

<img src="e2e/01-landing-movil.webp" alt="Landing en el celular" width="260">

**Registro (Google o email y contraseña, con elección de tipo)**

<img src="e2e/03-registro-movil.webp" alt="Registro (Google o email y contraseña, con elección de tipo)" width="260">

**Panel del usuario nuevo (sesión persistente)**

<img src="e2e/04-panel-usuario-movil.webp" alt="Panel del usuario nuevo (sesión persistente)" width="260">

**"Olvidé mi contraseña"**

<img src="e2e/02-olvide-contrasena-movil.webp" alt=""Olvidé mi contraseña"" width="260">

**Panel de administración (solo con login)**

<img src="e2e/06-admin-panel.webp" alt="Panel de administración (solo con login)" width="640">

**Administradores: dar rol de admin a quien ya se registró**

<img src="e2e/07-admin-administradores.webp" alt="Administradores: dar rol de admin a quien ya se registró" width="640">

