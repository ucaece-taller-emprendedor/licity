import { Beneficios } from '@/components/home/Beneficios'
import { ComoFunciona } from '@/components/home/ComoFunciona'
import { Confianza } from '@/components/home/Confianza'
import { CtaFinal } from '@/components/home/CtaFinal'
import { Hero } from '@/components/home/Hero'

export default function Landing() {
  return (
    <>
      <Hero />
      <ComoFunciona />
      <Beneficios />
      <Confianza />
      <CtaFinal />
    </>
  )
}
