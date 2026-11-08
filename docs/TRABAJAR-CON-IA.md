# Cómo trabajar este proyecto con una IA (guía para las personas dueñas)

No necesitás saber programar. Tu rol es **decidir qué querés**; la IA programa, prueba y te explica.

## Qué necesitás
1. Una cuenta de **GitHub** con acceso al repositorio `ucaece-taller-emprendedor/licity` (ya la tienen).
2. Una IA de programación que pueda leer el repo y trabajar con la terminal (por ejemplo Claude Code, o la que prefieran). Al abrirla en la carpeta del proyecto, lo primero que tiene que leer es **`CLAUDE.md`** (o `AGENTS.md`): ahí están las reglas del proyecto.
3. [Node.js 20+](https://nodejs.org) y [Java 21+](https://adoptium.net) instalados (la IA puede guiarte).

## Frase para arrancar cada sesión
> "Leé CLAUDE.md y docs/ARQUITECTURA.md. Quiero [lo que querés]. Antes de cambiar nada, explicame el plan en simple."

## El circuito de cualquier cambio
1. **Pedís** lo que querés, con ejemplos ("cuando un cliente confirma, quiero que vea un resumen").
2. **La IA propone un plan**; vos respondés sí / no / cambialo.
3. **La IA trabaja en una rama `feature/...`**, corre las pruebas y abre un PR hacia `qa`.
4. **Revisás la vista previa** (la IA te pasa el enlace) y decís "está bien" o qué corregir.
5. **Se publica:** la IA abre el PR `qa` → `prod`; cuando alguien con permiso lo aprueba y se mergea, GitHub publica el sitio solo.

## Reglas simples para vos
- Pedí cosas **de a una**; los cambios chicos son más seguros.
- Si la IA propone algo que cuesta plata, usa tarjeta o activa el plan Blaze: **decile que no** (el proyecto es gratuito a propósito).
- Nunca le pases contraseñas ni claves a la IA ni las pegues en el chat; si las necesita, te va a indicar dónde cargarlas vos.
- Si la IA dice "borrar", "cambiar permisos" o "reglas", pedile que te explique el riesgo antes de aceptar.
- Si algo salió mal en producción: pedí **volver atrás** (la IA hace un *revert* del último PR a `prod`).

## Dar acceso de admin a alguien del equipo
1. La persona se **registra** en la app (`/app/registro`).
2. Un admin entra a `/admin/administradores`, la busca y toca **Hacer admin**.
3. La persona cierra sesión y entra por `/admin/login`.
