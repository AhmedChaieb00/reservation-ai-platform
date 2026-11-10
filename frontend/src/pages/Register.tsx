import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', department: '', phone: ''
  })
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    try {
      const { confirmPassword, ...data } = form
      void confirmPassword
      await registerUser(data)
      navigate('/dashboard')
    } catch {
      setError('Erreur lors de la création du compte')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ITEAM Réservation</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Créer un compte</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom</label>
                <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)}
                  className="input-field" required />
              </div>
              <div>
                <label className="label">Nom</label>
                <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)}
                  className="input-field" required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="input-field" placeholder="votre@email.tn" required />
            </div>
            <div>
              <label className="label">Département</label>
              <input type="text" value={form.department} onChange={e => set('department', e.target.value)}
                className="input-field" placeholder="Informatique, RH..." />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className="input-field" minLength={8} required />
            </div>
            <div>
              <label className="label">Confirmer le mot de passe</label>
              <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                className="input-field" required />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center">
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Créer mon compte'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
