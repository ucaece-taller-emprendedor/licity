/**
 * Datos de DEMOSTRACIÓN. Todo lo que crea este script está marcado con isDemo=true
 * y se borra y recrea cada vez que se corre (es idempotente).
 *
 * Uso: npm run db:seed        (después de npm run db:migrate)
 *
 * Las credenciales de abajo son públicas (están en el README): no corras el seed
 * en una base real sin cambiar o borrar estas cuentas después.
 */
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { db, pool } from './index'
import {
  account,
  awards,
  clientProfiles,
  contractorProfiles,
  notifications,
  offers,
  payments,
  user,
  verificationRequests,
  workUpdates,
  works,
} from './schema'
import { COMMISSION_RATE } from '../constants'

export const DEMO_PASSWORD = 'Licity-Demo-2026'

export const DEMO_USERS = {
  pyme: { email: 'pyme@licity.demo', name: 'Marta Gómez (DEMO)' },
  contratista: { email: 'contratista@licity.demo', name: 'Raúl Benítez (DEMO)' },
  contratista2: { email: 'contratista2@licity.demo', name: 'Lucía Ferrero (DEMO)' },
  pendiente: { email: 'pendiente@licity.demo', name: 'Diego Paz (DEMO)' },
  admin: { email: 'admin@licity.demo', name: 'Admin Licity (DEMO)' },
} as const

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

async function createUser(
  key: keyof typeof DEMO_USERS,
  role: 'CLIENT' | 'BUSINESS' | 'SUPERADMIN',
  passwordHash: string,
) {
  const id = randomUUID()
  const { email, name } = DEMO_USERS[key]
  await db.insert(user).values({ id, name, email, emailVerified: true, role, isDemo: true })
  await db.insert(account).values({
    id: randomUUID(),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: passwordHash,
  })
  return id
}

async function main() {
  // Limpieza: borrar usuarios demo arrastra perfiles, obras, ofertas, pagos y avisos (ON DELETE CASCADE).
  await db.delete(user).where(eq(user.isDemo, true))
  for (const { email } of Object.values(DEMO_USERS)) await db.delete(user).where(eq(user.email, email))

  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const pymeId = await createUser('pyme', 'CLIENT', passwordHash)
  const c1 = await createUser('contratista', 'BUSINESS', passwordHash)
  const c2 = await createUser('contratista2', 'BUSINESS', passwordHash)
  const pend = await createUser('pendiente', 'BUSINESS', passwordHash)
  await createUser('admin', 'SUPERADMIN', passwordHash)

  await db.insert(clientProfiles).values({
    userId: pymeId,
    companyName: 'Panadería Del Puerto (DEMO)',
    cuit: '30712345678',
    city: 'Mar del Plata',
    phone: '223 555-0101',
  })

  const verified = { verificationStatus: 'APPROVED' as const, verifiedAt: daysAgo(20) }
  await db.insert(contractorProfiles).values([
    {
      userId: c1,
      displayName: 'Benítez Construcciones (DEMO)',
      cuit: '20123456780',
      specialty: 'Albañilería y reformas',
      city: 'Mar del Plata',
      coverageZone: 'Mar del Plata y Batán',
      description: 'Reformas y ampliaciones de locales comerciales. Datos de ejemplo.',
      yearsExperience: 12,
      phone: '223 555-0102',
      ...verified,
    },
    {
      userId: c2,
      displayName: 'Ferrero Instalaciones (DEMO)',
      cuit: '27234567891',
      specialty: 'Electricidad y plomería',
      city: 'Mar del Plata',
      coverageZone: 'Partido de General Pueyrredon',
      description: 'Instalaciones eléctricas y sanitarias. Datos de ejemplo.',
      yearsExperience: 8,
      phone: '223 555-0103',
      ...verified,
    },
    {
      userId: pend,
      displayName: 'Paz Pintura y Revestimientos (DEMO)',
      cuit: '20345678902',
      specialty: 'Pintura',
      city: 'Mar del Plata',
      description: 'Contratista pendiente de verificación: sirve para mostrar la aprobación del admin.',
      yearsExperience: 3,
      phone: '223 555-0104',
    },
  ])
  await db.insert(verificationRequests).values([
    { contractorUserId: c1, status: 'APPROVED', submittedAt: daysAgo(21), reviewedAt: daysAgo(20) },
    { contractorUserId: c2, status: 'APPROVED', submittedAt: daysAgo(21), reviewedAt: daysAgo(20) },
    {
      contractorUserId: pend,
      status: 'PENDING',
      snapshot: { displayName: 'Paz Pintura y Revestimientos (DEMO)', cuit: '20345678902', specialty: 'Pintura', city: 'Mar del Plata' },
    },
  ])

  const base = { clientUserId: pymeId, city: 'Mar del Plata', isDemo: true }

  // 1) Publicada, sin ofertas todavía
  await db.insert(works).values({
    ...base,
    title: 'Pintura de fachada del local (DEMO)',
    description: 'Pintura exterior de 120 m² con látex para exteriores, incluye andamio y preparación de la superficie.',
    category: 'Pintura',
    estimatedDays: 10,
    budgetEstimate: '1800000.00',
    publishedAt: daysAgo(1),
  })

  // 2) Recibiendo ofertas (dos ofertas para comparar y adjudicar)
  const [open] = await db
    .insert(works)
    .values({
      ...base,
      title: 'Reforma de cocina industrial (DEMO)',
      description:
        'Reforma de la cocina de producción: piso antideslizante, revestimiento cerámico en paredes, nueva instalación eléctrica y campana de extracción.',
      category: 'Reforma / ampliación',
      desiredStartDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      estimatedDays: 30,
      budgetEstimate: '6500000.00',
      status: 'RECEIVING_OFFERS',
      publishedAt: daysAgo(4),
    })
    .returning()
  await db.insert(offers).values([
    {
      workId: open.id,
      contractorUserId: c1,
      amount: '6200000.00',
      estimatedDays: 28,
      description: 'Incluye demolición de revestimientos, piso, cerámicos y colocación de campana. Materiales incluidos.',
      createdAt: daysAgo(3),
    },
    {
      workId: open.id,
      contractorUserId: c2,
      amount: '6850000.00',
      estimatedDays: 24,
      description: 'Instalación eléctrica completa nueva, gas y extracción. Plazo menor con cuadrilla dedicada.',
      createdAt: daysAgo(2),
    },
  ])
  await db.insert(workUpdates).values({
    workId: open.id,
    kind: 'STATUS',
    toStatus: 'RECEIVING_OFFERS',
    message: 'La obra recibió su primera oferta.',
    createdAt: daysAgo(3),
  })

  // 3) En ejecución, adjudicada a contratista@
  const [running] = await db
    .insert(works)
    .values({
      ...base,
      title: 'Impermeabilización de techo (DEMO)',
      description: 'Membrana asfáltica con aluminio en 90 m² de techo plano, con reparación de pendientes y desagües.',
      category: 'Techos e impermeabilización',
      estimatedDays: 12,
      budgetEstimate: '2400000.00',
      status: 'IN_PROGRESS',
      progress: 40,
      publishedAt: daysAgo(15),
      awardedAt: daysAgo(10),
      startedAt: daysAgo(6),
    })
    .returning()
  const [runningOffer] = await db
    .insert(offers)
    .values({
      workId: running.id,
      contractorUserId: c1,
      amount: '2350000.00',
      estimatedDays: 12,
      description: 'Membrana de 4 mm con aluminio, garantía de 10 años.',
      status: 'ACCEPTED',
      createdAt: daysAgo(13),
    })
    .returning()
  await db.insert(awards).values({
    workId: running.id,
    offerId: runningOffer.id,
    contractorUserId: c1,
    clientUserId: pymeId,
    amount: '2350000.00',
    awardedAt: daysAgo(10),
  })
  await db.insert(workUpdates).values([
    { workId: running.id, authorUserId: pymeId, kind: 'STATUS', toStatus: 'AWARDED', message: 'Obra adjudicada.', createdAt: daysAgo(10) },
    { workId: running.id, authorUserId: c1, kind: 'STATUS', fromStatus: 'AWARDED', toStatus: 'IN_PROGRESS', message: 'El contratista inició la ejecución.', createdAt: daysAgo(6) },
    { workId: running.id, authorUserId: c1, kind: 'PROGRESS', progress: 40, message: 'Reparación de pendientes y primera mano de imprimación.', createdAt: daysAgo(2) },
  ])

  // 4) Finalizada, con registro de pago de prueba
  const [done] = await db
    .insert(works)
    .values({
      ...base,
      title: 'Instalación eléctrica del local (DEMO)',
      description: 'Renovación del tablero principal y cableado del salón de ventas.',
      category: 'Electricidad',
      estimatedDays: 8,
      budgetEstimate: '1500000.00',
      status: 'COMPLETED',
      progress: 100,
      publishedAt: daysAgo(40),
      awardedAt: daysAgo(35),
      startedAt: daysAgo(30),
      contractorDoneAt: daysAgo(22),
      completedAt: daysAgo(21),
    })
    .returning()
  const [doneOffer] = await db
    .insert(offers)
    .values({
      workId: done.id,
      contractorUserId: c2,
      amount: '1450000.00',
      estimatedDays: 8,
      description: 'Tablero nuevo con térmicas y disyuntores, cableado según normativa.',
      status: 'ACCEPTED',
      createdAt: daysAgo(38),
    })
    .returning()
  await db.insert(awards).values({
    workId: done.id,
    offerId: doneOffer.id,
    contractorUserId: c2,
    clientUserId: pymeId,
    amount: '1450000.00',
    awardedAt: daysAgo(35),
  })
  await db.insert(workUpdates).values([
    { workId: done.id, authorUserId: pymeId, kind: 'STATUS', toStatus: 'AWARDED', message: 'Obra adjudicada.', createdAt: daysAgo(35) },
    { workId: done.id, authorUserId: c2, kind: 'STATUS', fromStatus: 'AWARDED', toStatus: 'IN_PROGRESS', message: 'El contratista inició la ejecución.', createdAt: daysAgo(30) },
    { workId: done.id, authorUserId: c2, kind: 'STATUS', fromStatus: 'IN_PROGRESS', toStatus: 'COMPLETED', message: 'La PyME confirmó la finalización.', createdAt: daysAgo(21) },
  ])
  await db.insert(payments).values({
    workId: done.id,
    finalAmount: '1450000.00',
    commissionRate: String(COMMISSION_RATE),
    commissionAmount: (1450000 * COMMISSION_RATE).toFixed(2),
    status: 'TEST_RECORD',
    completedAt: daysAgo(21),
    isDemo: true,
  })

  await db.insert(notifications).values([
    { userId: pymeId, title: 'Nueva oferta recibida', body: 'Ferrero Instalaciones (DEMO) ofertó en "Reforma de cocina industrial (DEMO)".', href: `/app/pyme/obras/${open.id}` },
    { userId: c1, title: 'Tu oferta fue enviada', body: 'Reforma de cocina industrial (DEMO)', href: `/app/contratista/obras/${open.id}` },
  ])

  console.log('Seed de demostración listo. Usuarios (clave en el README):')
  for (const { email } of Object.values(DEMO_USERS)) console.log(`  - ${email}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
