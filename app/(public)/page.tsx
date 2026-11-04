import { Hero } from '@/components/home/hero'
import { HowItWorks } from '@/components/home/how-it-works'
import { Benefits } from '@/components/home/benefits'
import { Trust } from '@/components/home/trust'
import { FinalCta } from '@/components/home/final-cta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Benefits />
      <Trust />
      <FinalCta />
    </>
  )
}
