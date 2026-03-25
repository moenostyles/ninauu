'use client'
import { AuthProvider } from '@/lib/auth-context'
import { WeightUnitProvider } from '@/lib/weight-unit-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WeightUnitProvider>{children}</WeightUnitProvider>
    </AuthProvider>
  )
}
