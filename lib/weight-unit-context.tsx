'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Unit = 'g' | 'oz'

interface WeightUnitContextValue {
  unit: Unit
  toggle: () => void
  fmt: (g: number) => string
}

const WeightUnitContext = createContext<WeightUnitContextValue>({
  unit: 'g',
  toggle: () => {},
  fmt: (g) => (g >= 1000 ? `${(g / 1000).toFixed(2)}kg` : `${g}g`),
})

export function WeightUnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<Unit>('g')

  useEffect(() => {
    const saved = localStorage.getItem('ninauu_weight_unit')
    if (saved === 'oz') setUnit('oz')
  }, [])

  const toggle = () => {
    setUnit((prev) => {
      const next = prev === 'g' ? 'oz' : 'g'
      localStorage.setItem('ninauu_weight_unit', next)
      return next
    })
  }

  const fmt = (g: number): string => {
    if (unit === 'oz') {
      return `${(g / 28.3495).toFixed(1)}oz`
    }
    return g >= 1000 ? `${(g / 1000).toFixed(2)}kg` : `${g}g`
  }

  return (
    <WeightUnitContext.Provider value={{ unit, toggle, fmt }}>
      {children}
    </WeightUnitContext.Provider>
  )
}

export function useWeightUnit() {
  return useContext(WeightUnitContext)
}
