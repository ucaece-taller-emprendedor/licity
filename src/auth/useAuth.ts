import { useContext } from 'react'
import { AuthContext, type AuthValor } from './AuthContext'

export function useAuth(): AuthValor {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return v
}
