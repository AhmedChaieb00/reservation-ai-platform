import { useState } from 'react'
import { User, Mail, Phone, Building2, Shield } from 'lucide-react'
import { updateProfile } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const roleLabels = { USER: 'Utilisateur', MANAGER: 'Gestionnaire', ADMIN: 'Administrateur' }
const roleColors = {
  USER: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
}

export default function Profile() {
  const { user } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    department: user?.department || '',
    phone: user?.phone || '',
  })

  const handleSave = async () => {
    try {
      await updateProfile(form)
      toast.success('Profil mis à jour')
      setEditing(false)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mon profil</h1>
        <p className="text-slate-500">Gérez vos informations personnelles</p>
      </div>

      <div className="card">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user.firstName} {user.lastName}</h2>
            <p className="text-slate-500">{user.email}</p>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
              <Shield size={12} />
              {roleLabels[user.role]}
            </span>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="ml-auto btn-secondary"
          >
            {editing ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prénom</label>
                <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Nom</label>
                <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div>
              <label className="label">Département</label>
              <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-field" />
            </div>
            <button onClick={handleSave} className="btn-primary w-full">Enregistrer les modifications</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: User, label: 'Nom complet', value: `${user.firstName} ${user.lastName}` },
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Building2, label: 'Département', value: user.department || 'Non renseigné' },
              { icon: Phone, label: 'Téléphone', value: user.phone || 'Non renseigné' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Icon size={18} className="text-primary-500 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-sm font-medium text-slate-800">{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
