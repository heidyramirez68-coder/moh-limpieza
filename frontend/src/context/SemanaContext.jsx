import React, { createContext, useContext, useState } from 'react'
import { startOfWeek } from 'date-fns'

const SemanaContext = createContext(null)

export function SemanaProvider({ children }) {
  const [semanaVista, setSemanaVista] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  return (
    <SemanaContext.Provider value={{ semanaVista, setSemanaVista }}>
      {children}
    </SemanaContext.Provider>
  )
}

export function useSemana() {
  return useContext(SemanaContext)
}
