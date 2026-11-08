import { Alerta } from '@/components/ui'
import { MARCA } from '@/config/app'

const Correo = () => (
  <a href={`mailto:${MARCA.contacto}`} className="font-bold underline underline-offset-4">{MARCA.contacto}</a>
)

function Pagina({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-5xl">{titulo}</h1>
      <div className="mt-6">
        <Alerta tipo="aviso">Borrador del MVP. Este texto debe ser revisado por un profesional legal antes del lanzamiento comercial.</Alerta>
      </div>
      <div className="mt-8 space-y-6 leading-relaxed">{children}</div>
    </div>
  )
}
const Bloque = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-2 text-2xl">{titulo}</h2>
    <p>{children}</p>
  </section>
)

export function Terminos() {
  return (
    <Pagina titulo="Términos y condiciones">
      <Bloque titulo="1. Qué es Licity">Licity es una plataforma que conecta a PyMEs que necesitan realizar obras con contratistas que ofrecen sus servicios. Licity facilita la publicación de obras, la comparación de ofertas y el seguimiento, pero no ejecuta las obras ni es parte del contrato entre la PyME y el contratista.</Bloque>
      <Bloque titulo="2. Cuentas y verificación">Cada persona es responsable de la veracidad de los datos que carga. Las cuentas de contratistas son revisadas por Licity antes de poder enviar ofertas; la verificación no constituye una garantía sobre la calidad del trabajo.</Bloque>
      <Bloque titulo="3. Comisión">Publicar una obra no tiene costo para la PyME. Licity cobra una comisión del 1,5% sobre el monto final de cada obra finalizada. La integración con una pasarela de pagos está pendiente: hasta entonces, los pagos son simulados y se muestran como «Registro de prueba»; no se procesa ni se mueve dinero dentro de la plataforma.</Bloque>
      <Bloque titulo="4. Conducta">No está permitido publicar contenido falso, ofrecer servicios sin estar habilitado para ello ni usar la plataforma para eludir las comisiones. Licity puede suspender cuentas que incumplan estas reglas.</Bloque>
      <section>
        <h2 className="mb-2 text-2xl">5. Contacto</h2>
        <p>Para consultas escribinos a <Correo />.</p>
      </section>
    </Pagina>
  )
}

export function Privacidad() {
  return (
    <Pagina titulo="Política de privacidad">
      <Bloque titulo="Datos que recolectamos">Nombre, correo electrónico, datos de la empresa o del contratista (nombre, CUIT, ciudad, teléfono) y la información de las obras y ofertas que cargás en la plataforma. El acceso (contraseña o cuenta de Google) lo gestiona Firebase Authentication de Google.</Bloque>
      <Bloque titulo="Para qué los usamos">Para crear tu cuenta, mostrar tus obras y ofertas a las partes involucradas, verificar contratistas, enviarte avisos dentro de la plataforma y calcular comisiones de referencia.</Bloque>
      <Bloque titulo="Quién puede ver tus datos">Los contratistas habilitados ven las obras abiertas. La PyME ve las ofertas de los contratistas que le ofertan. El equipo de Licity accede a los datos para moderar y dar soporte.</Bloque>
      <section>
        <h2 className="mb-2 text-2xl">Tus derechos</h2>
        <p>Podés pedir acceso, corrección o eliminación de tus datos escribiendo a <Correo />.</p>
      </section>
    </Pagina>
  )
}
