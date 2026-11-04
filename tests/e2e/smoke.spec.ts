import { expect, test } from '@playwright/test'

// Credenciales de DEMO definidas en lib/db/seed.ts (npm run db:seed).
const DEMO_PASSWORD = 'Licity-Demo-2026'
const ADMIN_EMAIL = 'admin@licity.demo'

test.describe('Licity - test de humo', () => {
  test('la landing muestra el mensaje, "Ingresar" y "Registrarme"', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('bajo control')
    await expect(page.getByRole('link', { name: 'Ingresar' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Registrarme' }).first()).toBeVisible()
  })

  test('una PyME se registra, sale y vuelve a ingresar', async ({ page }, testInfo) => {
    const email = `e2e-${Date.now()}-${testInfo.project.name}@example.com`
    const password = 'una-clave-segura-123'

    await page.goto('/app/registro/pyme')
    await page.getByLabel('Tu nombre y apellido').fill('Prueba Automática')
    await page.getByLabel('Correo electrónico').fill(email)
    await page.getByLabel('Contraseña').fill(password)
    await page.getByLabel('Nombre de la empresa').fill('Empresa E2E')
    await page.getByLabel('Ciudad').fill('Mar del Plata')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Crear cuenta de PyME' }).click()
    await expect(page).toHaveURL(/\/app\/pyme$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hola, Prueba')

    await page.getByRole('button', { name: 'Salir' }).click()
    await expect(page).toHaveURL('/')

    await page.goto('/app/ingresar')
    await page.getByLabel('Correo electrónico').fill(email)
    await page.getByLabel('Contraseña').fill(password)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page).toHaveURL(/\/app\/pyme$/)
  })

  test('el panel /admin pide login, no tiene registro y deja entrar al superadmin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/ingresar$/)
    await expect(page.getByRole('link', { name: /registr/i })).toHaveCount(0)

    await page.getByLabel('Correo electrónico').fill(ADMIN_EMAIL)
    await page.getByLabel('Contraseña').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Resumen')
  })

  test('una PyME no puede entrar al panel de admin', async ({ page }) => {
    await page.goto('/app/ingresar')
    await page.getByLabel('Correo electrónico').fill('pyme@licity.demo')
    await page.getByLabel('Contraseña').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page).toHaveURL(/\/app\/pyme$/)
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin$/)
  })
})
