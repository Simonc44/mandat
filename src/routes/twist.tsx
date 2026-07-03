import { createFileRoute } from '@tanstack/react-router'
import TwistLanding from '../components/twist/TwistLanding'

export const Route = createFileRoute('/twist')({
  component: TwistLanding,
})
