import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-primary-700 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <AlertCircle size={64} className="mx-auto mb-4 opacity-80" />
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-2">Page introuvable</p>
        <p className="text-blue-200 mb-8">La page que vous cherchez n'existe pas.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
          <Home size={18} /> Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
