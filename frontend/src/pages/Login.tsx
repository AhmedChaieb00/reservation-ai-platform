import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Users, CalendarDays, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const stats = [
  { label: 'Salles disponibles', value: '8',  icon: BookOpen },
  { label: 'Utilisateurs actifs', value: '7',  icon: Users },
  { label: 'Réservations/mois',  value: '40+', icon: CalendarDays },
  { label: "Taux d'occupation",   value: '80%', icon: TrendingUp },
]

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Email ou mot de passe incorrect. Veuillez réessayer.')
    }
  }

  const fillDemo = (role: 'admin' | 'manager' | 'user') => {
    const accounts = {
      admin:   { email: 'admin@iteam.tn',   password: 'Admin@123' },
      manager: { email: 'manager@iteam.tn', password: 'Admin@123' },
      user:    { email: 'user1@iteam.tn',   password: 'Admin@123' },
    }
    setEmail(accounts[role].email)
    setPassword(accounts[role].password)
    setError('')
  }

  return (
    <div className="min-h-screen flex min-h-[100dvh]">

      {/* ── Left panel — ITEAM branding ───────────────────── */}
      <div className="hidden lg:flex w-[42%] bg-gradient-to-br from-iteam-800 via-iteam-700 to-iteam-600 flex-col justify-between p-10 relative overflow-hidden">

        {/* Background geometric pattern */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%),repeating-linear-gradient(-45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:'28px 28px'}} />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-navy-900/20" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-gold-500/10" />

        {/* Logo + name */}
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5">
            <img src="/logo-iteam.png" alt="ITEAM" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-wide">ITEAM University</div>
            <div className="text-gold-300 text-xs font-medium uppercase tracking-widest">Système de Réservation</div>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-400/30 rounded-full px-3 py-1 mb-6">
            <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
            <span className="text-gold-300 text-xs font-semibold tracking-wide uppercase">Plateforme académique</span>
          </div>

          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            Gestion intelligente<br />des salles de conférence
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Réservez vos espaces de travail, gérez les équipements et optimisez
            l'utilisation des ressources grâce à notre module d'intelligence artificielle.
          </p>

          {/* Stats grid */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/12 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-gold-300" />
                  </div>
                  <div>
                    <div className="text-white text-xl font-bold leading-none">{value}</div>
                    <div className="text-white/50 text-xs mt-1">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs">© 2025 ITEAM University — Tous droits réservés</p>
      </div>

      {/* ── Right panel — form ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-warm-50">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-iteam-600 flex items-center justify-center p-1.5">
              <img src="/logo-iteam.png" alt="ITEAM" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div>
              <div className="font-bold text-iteam-700 text-sm">ITEAM University</div>
              <div className="text-xs text-gray-500">Système de réservation</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="text-sm text-gray-500 mt-1">Accédez à votre espace de réservation.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3 py-3 bg-iteam-50 border border-iteam-200 text-iteam-700 rounded-xl text-sm">
              <span className="w-4 h-4 rounded-full bg-iteam-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-iteam-600 font-bold text-xs">!</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre@iteam.tn"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary justify-center py-2.5 font-semibold text-sm mt-2"
            >
              {isLoading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : 'Se connecter'
              }
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Pas de compte ?{' '}
            <Link to="/register" className="text-iteam-600 hover:text-iteam-700 font-semibold">
              Créer un compte
            </Link>
          </p>

          {/* Demo accounts: only shown when built with VITE_DEMO_MODE=true */}
          {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <div className="mt-7 border-t border-warm-200 pt-6">
            <p className="text-xs text-gray-400 mb-3 text-center font-medium uppercase tracking-wide">Comptes de démonstration</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { role: 'admin',   label: 'Admin',       color: 'border-iteam-200 hover:bg-iteam-50 hover:border-iteam-400 hover:text-iteam-700' },
                { role: 'manager', label: 'Responsable',  color: 'border-navy-200  hover:bg-navy-50  hover:border-navy-400  hover:text-navy-700' },
                { role: 'user',    label: 'Utilisateur',  color: 'border-gold-200  hover:bg-gold-50  hover:border-gold-400  hover:text-gold-700' },
              ] as const).map(({ role, label, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className={`py-2 px-2 text-xs border rounded-lg text-gray-500 transition-all ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2">Mot de passe universel : Admin@123</p>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
