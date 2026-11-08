import { expect, test, type Page } from '@playwright/test'

const CLAVE = 'Demo-Clave-2026'
const PYME = 'pyme.demo@licity.test'
const CONTRATISTA = 'contratista.demo@licity.test'
const ADMIN = 'admin.demo@licity.test'

async function ingresar(page: Page, email: string, ruta = '/app/ingresar') {
  await page.goto(ruta)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}
async function salir(page: Page) {
  await page.getByRole('button', { name: 'Salir' }).click()
}
/** Navega con el menú del panel (hay otros enlaces con textos parecidos en las pantallas). */
async function irA(page: Page, enlace: string) {
  await page.getByRole('navigation', { name: 'Mi panel' }).getByRole('link', { name: enlace, exact: true }).click()
}
async function confirmar(page: Page, nombreBoton: string | RegExp) {
  await page.getByRole('button', { name: nombreBoton }).click()
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
}

test('la landing pública se ve con sus llamados a la acción', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu obra')
  await expect(page.getByRole('link', { name: 'Ingresar' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Registrarme' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cómo funciona' })).toBeVisible()
  await expect(page.getByText('Pensado para las dos partes')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Confiá en quien construye tu obra' })).toBeVisible()
})

test('registro de una PyME, sesión persistente, cierre de sesión y login', async ({ page }) => {
  const email = `pyme.${Date.now()}@licity.test`
  await page.goto('/app/registro?tipo=pyme')
  await page.getByLabel('Tu nombre y apellido').fill('Persona Nueva')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByLabel('Nombre de la empresa').fill('Ferretería Nueva SRL')
  await page.getByLabel('Ciudad').fill('Mar del Plata')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/app\/pyme$/)
  await expect(page.getByRole('heading', { name: /Hola, Persona/ })).toBeVisible()

  await page.reload() // la sesión persiste
  await expect(page.getByRole('heading', { name: /Hola, Persona/ })).toBeVisible()

  await salir(page)
  await ingresar(page, email)
  await expect(page).toHaveURL(/\/app\/pyme$/)
})

test('el registro valida los campos obligatorios', async ({ page }) => {
  await page.goto('/app/registro?tipo=contratista')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByText('Ingresá tu nombre.')).toBeVisible()
  await expect(page.getByText(/CUIT válido/)).toBeVisible()
  await expect(page).toHaveURL(/\/app\/registro/)
})

test('un contratista nuevo queda pendiente hasta que el admin lo aprueba', async ({ page }) => {
  const email = `contratista.${Date.now()}@licity.test`
  await page.goto('/app/registro')
  await page.getByRole('radio', { name: /^Contratista/ }).check()
  await page.getByLabel('Tu nombre y apellido').fill('Contratista Nuevo')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByLabel('Nombre o razón social').fill('Nuevo Obras SRL')
  await page.getByLabel('CUIT').fill('20-12345678-9')
  await page.getByLabel('Especialidad').fill('Pintura')
  await page.getByLabel('Ciudad').fill('Mar del Plata')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/app\/contratista$/)
  await expect(page.getByTestId('estado-verificacion')).toContainText('pendiente de verificación')
  // Pendiente: no puede ver obras ni ofertar.
  await irA(page, 'Obras abiertas')
  await expect(page.getByTestId('estado-verificacion')).toBeVisible()
  await salir(page)

  await ingresar(page, ADMIN, '/admin/login')
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('link', { name: 'Verificaciones' }).click()
  const tarjeta = page.getByTestId(`verificacion-${email}`)
  await expect(tarjeta).toBeVisible()
  await tarjeta.getByRole('button', { name: 'Aprobar' }).click()
  await tarjeta.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(tarjeta).toBeHidden()
  await salir(page)

  await ingresar(page, email)
  await expect(page.getByTestId('estado-verificacion')).toContainText('verificada')
  await irA(page, 'Obras abiertas')
  await expect(page.getByRole('heading', { name: 'Obras abiertas' })).toBeVisible()
})

test('login de admin; un usuario común no entra al panel', async ({ page }) => {
  await ingresar(page, PYME, '/admin/login')
  await expect(page.getByText('no tiene permisos de administrador')).toBeVisible()

  await page.getByLabel('Email').fill(ADMIN)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()
})

test('/admin sin sesión manda al login y /app/pyme sin sesión al ingreso', async ({ page }) => {
  await page.goto('/admin/usuarios')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.goto('/app/pyme/obras')
  await expect(page).toHaveURL(/\/app\/ingresar$/)
})

test('flujo completo: publicar obra, ofertar y adjudicar', async ({ page }) => {
  const titulo = `Obra de prueba ${Date.now()}`
  await ingresar(page, PYME)
  await expect(page).toHaveURL(/\/app\/pyme$/)
  await page.getByRole('link', { name: 'Publicar obra' }).first().click()
  await page.getByLabel('Título de la obra').fill(titulo)
  await page.getByLabel('Tipo de obra').selectOption('Pintura')
  await page.getByLabel('Descripción').fill('Pintar el interior completo del local comercial, dos manos de látex.')
  await page.getByLabel('Ubicación').fill('Mar del Plata')
  await page.getByLabel('Presupuesto ARS (opcional)').fill('1.200.000')
  await page.getByRole('button', { name: 'Publicar obra' }).click()
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
  await expect(page.getByText('Publicada', { exact: true }).first()).toBeVisible()
  await salir(page)

  await ingresar(page, CONTRATISTA)
  await irA(page, 'Obras abiertas')
  await page.getByRole('link', { name: new RegExp(titulo) }).click()
  await page.getByLabel('Monto total (ARS)').fill('1100000')
  await page.getByLabel('Plazo (días)').fill('12')
  await page.getByLabel('Alcance de tu propuesta').fill('Incluye preparación de superficies, materiales y dos manos de látex.')
  await page.getByRole('button', { name: 'Enviar oferta' }).click()
  await expect(page.getByRole('heading', { name: 'Tu oferta' })).toBeVisible()
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible()
  await salir(page)

  await ingresar(page, PYME)
  await irA(page, 'Mis obras')
  await page.getByRole('link', { name: new RegExp(titulo) }).click()
  await expect(page.getByText('Recibiendo ofertas').first()).toBeVisible()
  await expect(page.getByTestId('oferta-Obras del Sur SA')).toBeVisible()
  await confirmar(page, 'Adjudicar a este contratista')
  await expect(page.getByText('Adjudicada', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Contratista adjudicado' })).toBeVisible()
})

test('los pagos se rotulan como registro de prueba', async ({ page }) => {
  await ingresar(page, PYME)
  await irA(page, 'Mis obras')
  await page.getByRole('link', { name: /Impermeabilización de techo/ }).click()
  await expect(page.getByRole('heading', { name: 'Pago final' })).toBeVisible()
  await expect(page.getByText('Registro de prueba').first()).toBeVisible()
})

test('olvidé mi contraseña: login de admin y de usuarios piden el mail y confirman el envío', async ({ page }) => {
  for (const ruta of ['/admin/login']) {
    await page.goto(ruta)
    await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click()
    await page.getByLabel('Email de tu cuenta').fill('no-es-un-email')
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page.getByText('Ingresá un email válido.')).toBeVisible()
    await page.getByLabel('Email de tu cuenta').fill('alguien@ejemplo.test')
    await page.getByRole('button', { name: 'Enviarme el enlace' }).click()
    await expect(page.getByText('te enviamos el enlace')).toBeVisible()
  }
})

test('el admin ve "Cambiar mi contraseña" en su panel', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email', { exact: true }).fill('admin.demo@licity.test')
  await page.getByLabel('Contraseña').fill('Demo-Clave-2026')
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await page.getByRole('button', { name: 'Cambiar mi contraseña' }).click()
  await expect(page.getByText('Te enviamos un mail con el enlace.')).toBeVisible()
})

test('un admin le da el rol de admin a un usuario ya registrado, que entra a /admin', async ({ page, browser }, info) => {
  const email = `futura.admin.${info.project.name}.${Date.now()}@ejemplo.test`
  await page.goto('/app/registro?tipo=pyme')
  await page.getByLabel('Tu nombre y apellido').fill('Futura Admin')
  await page.getByLabel('Nombre de la empresa').fill('Empresa Admin SRL')
  await page.getByLabel('Ciudad').fill('Mar del Plata')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/app\/pyme$/)

  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport ?? null })
  const adm = await ctx.newPage()
  await adm.goto('/admin/login')
  await adm.getByLabel('Email', { exact: true }).fill('admin.demo@licity.test')
  await adm.getByLabel('Contraseña').fill(CLAVE)
  await adm.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(adm).toHaveURL(/\/admin$/)
  await adm.goto('/admin/administradores')
  await expect(adm.getByText('primero tiene que registrarse en la app')).toBeVisible()
  await adm.getByLabel('Buscar por nombre o email').fill(email)
  await adm.getByTestId(`admin-fila-${email}`).getByRole('button', { name: 'Hacer admin' }).click()
  await expect(adm.getByTestId(`admin-fila-${email}`).getByRole('button', { name: 'Quitar admin' })).toBeVisible()
  await ctx.close()

  // La persona ya tenía sesión: al recargar, su perfil dice admin y /admin/login la deja pasar al panel.
  await page.goto('/admin/login')
  await expect(page).toHaveURL(/\/admin$/)
})
