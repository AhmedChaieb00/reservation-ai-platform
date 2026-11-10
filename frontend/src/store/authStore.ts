import { create } from 'zustand'
import type { User, AuthResponse } from '@/types'
import { login as apiLogin, register as apiRegister } from '@/services/api'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: object) => Promise<void>
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  initialize: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const response: AuthResponse = await apiLogin({ email, password })
      const user: User = {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        department: response.department,
        isActive: true,
      }
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token: response.token, isAuthenticated: true })
      toast.success(`Bienvenue ${user.firstName} !`)
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur de connexion'
      toast.error(msg)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const response: AuthResponse = await apiRegister(data as Parameters<typeof apiRegister>[0])
      const user: User = {
        id: response.id,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        department: response.department,
        isActive: true,
      }
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token: response.token, isAuthenticated: true })
      toast.success('Compte créé avec succès !')
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la création du compte'
      toast.error(msg)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
    toast.success('Déconnexion réussie')
  },
}))
