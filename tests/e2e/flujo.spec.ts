import { expect, test } from '@playwright/test'

// Recorrido completo: PyME publica → contratista se registra (pendiente) → admin aprueba →
// contratista oferta → PyME adjudica. Corre solo en escritorio para no duplicar datos.
const DEMO_PASSWORD = 'Licity-Demo-2026'

test('flujo completo de una licitación', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'escritorio', 'Se corre una sola vez, en escritorio')
  const baseURL = testInfo.project.use.baseURL as string
  const stamp = Date.now()
  const pymeEmail = `flujo-pyme-${stamp}@example.com`
  const contratistaEmail = `flujo-contratista-${stamp}@example.com`
  const password = 'una-clave-segura-123'
  const obra = `Obra E2E ${stamp}`

  const pyme = await (await browser.newContext({ baseURL })).newPage()
  const contratista = await (await browser.newContext({ baseURL })).newPage()
  const admin = await (await browser.newContext({ baseURL })).newPage()

  // 1) La PyME se registra y publica una obra
  await pyme.goto('/app/registro/pyme')
  await pyme.getByLabel('Tu nombre y apellido').fill('Pyme Flujo')
  await pyme.getByLabel('Correo electrónico').fill(pymeEmail)
  await pyme.getByLabel('Contraseña').fill(password)
  await pyme.getByLabel('Nombre de la empresa').fill('Empresa Flujo')
  await pyme.getByLabel('Ciudad').fill('Mar del Plata')
  await pyme.getByRole('checkbox').check()
  await pyme.getByRole('button', { name: 'Crear cuenta de PyME' }).click()
  await expect(pyme).toHaveURL(/\/app\/pyme$/)

  await pyme.goto('/app/pyme/obras/nueva')
  await pyme.getByLabel('Título de la obra').fill(obra)
  await pyme.getByLabel('Tipo de obra').selectOption('Pintura')
  await pyme.getByLabel('Descripción').fill('Pintura de un salón de 80 m² con dos manos de látex.')
  await pyme.getByLabel('Ubicación').fill('Mar del Plata')
  await pyme.getByRole('button', { name: 'Publicar obra' }).click()
  await expect(pyme).toHaveURL(/\/app\/pyme\/obras\/[0-9a-f-]{36}$/)
  await expect(pyme.getByRole('heading', { level: 1 })).toContainText(obra)
  const workUrl = pyme.url()

  // 2) El contratista se registra y queda pendiente de verificación
  await contratista.goto('/app/registro/contratista')
  await contratista.getByLabel('Tu nombre y apellido').fill('Contratista Flujo')
  await contratista.getByLabel('Correo electrónico').fill(contratistaEmail)
  await contratista.getByLabel('Contraseña').fill(password)
  await contratista.getByLabel('Nombre o razón social').fill(`Flujo Pinturas ${stamp}`)
  await contratista.getByLabel(/^CUIT/).fill('20-30405060-7')
  await contratista.getByLabel('Especialidad').fill('Pintura')
  await contratista.getByLabel(/^Ciudad/).fill('Mar del Plata')
  await contratista.getByRole('checkbox').check()
  await contratista.getByRole('button', { name: 'Crear cuenta de contratista' }).click()
  await expect(contratista).toHaveURL(/\/app\/contratista$/)
  await expect(contratista.getByText('pendiente de verificación').first()).toBeVisible()

  // 3) El admin aprueba al contratista
  await admin.goto('/admin/ingresar')
  await admin.getByLabel('Correo electrónico').fill('admin@licity.demo')
  await admin.getByLabel('Contraseña').fill(DEMO_PASSWORD)
  await admin.getByRole('button', { name: 'Ingresar' }).click()
  await expect(admin).toHaveURL(/\/admin$/)
  await admin.goto('/admin/verificaciones')
  const card = admin.locator('li', { hasText: `Flujo Pinturas ${stamp}` })
  await card.getByRole('button', { name: 'Aprobar contratista' }).click()
  await card.getByRole('button', { name: 'Confirmar' }).click()
  // La solicitud pasa al historial con el estado "Verificado"
  await expect(admin.locator('li', { hasText: `Flujo Pinturas ${stamp}` }).getByText('Verificado', { exact: true })).toBeVisible()

  // 4) El contratista oferta
  await contratista.goto(workUrl.replace('/pyme/', '/contratista/'))
  await contratista.getByLabel('Monto total (ARS)').fill('950000')
  await contratista.getByLabel('Plazo (días)').fill('9')
  await contratista.getByLabel('Alcance de tu propuesta').fill('Dos manos de látex, incluye materiales y limpieza final.')
  await contratista.getByRole('button', { name: 'Enviar oferta' }).click()
  await expect(contratista.getByRole('heading', { name: 'Tu oferta' })).toBeVisible()

  // 5) La PyME adjudica
  await pyme.reload()
  await expect(pyme.getByText(`Flujo Pinturas ${stamp}`).first()).toBeVisible()
  await pyme.getByRole('button', { name: 'Adjudicar a este contratista' }).click()
  await pyme.getByRole('button', { name: 'Confirmar' }).click()
  await expect(pyme.getByText('Contratista adjudicado')).toBeVisible()
})
