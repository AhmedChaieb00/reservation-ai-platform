import { useState, useEffect } from 'react'
import { Users, Shield, Edit, Trash2, X } from 'lucide-react'
import { getUsers, updateUser, deleteUser } from '@/services/api'
import type { User } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const roleLabels = { USER: 'Utilisateur', MANAGER: 'Gestionnaire', ADMIN: 'Administrateur' }
const roleColors = { USER: 'bg-blue-100 text-blue-700', MANAGER: 'bg-purple-100 text-purple-700', ADMIN: 'bg-red-100 text-red-700' }

export default function UserManagement() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (currentUser?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />

  useEffect(() => {
    getUsers().then(setUsers).catch(() => toast.error('Erreur')).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!editUser) return
    try {
      const updated = await updateUser(editUser.id, editUser)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      setShowModal(false)
      toast.success('Utilisateur modifié')
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Désactiver cet utilisateur ?')) return
    try {
      await deleteUser(id)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u))
      toast.success('Utilisateur désactivé')
    } catch { toast.error('Erreur') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={24} className="text-primary-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-slate-500">{users.length} utilisateur(s)</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              {['Utilisateur', 'Email', 'Département', 'Rôle', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <span className="font-medium text-sm">{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{u.department || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditUser(u); setShowModal(true) }}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded"
                    >
                      <Edit size={15} />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <Shield size={18} /> Modifier l'utilisateur
              </h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom</label>
                  <input type="text" value={editUser.firstName} onChange={e => setEditUser(p => p && ({ ...p, firstName: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input type="text" value={editUser.lastName} onChange={e => setEditUser(p => p && ({ ...p, lastName: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Rôle</label>
                <select value={editUser.role} onChange={e => setEditUser(p => p && ({ ...p, role: e.target.value as User['role'] }))} className="input-field">
                  <option value="USER">Utilisateur</option>
                  <option value="MANAGER">Gestionnaire</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="label">Département</label>
                <input type="text" value={editUser.department || ''} onChange={e => setEditUser(p => p && ({ ...p, department: e.target.value }))} className="input-field" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editUser.isActive} onChange={e => setEditUser(p => p && ({ ...p, isActive: e.target.checked }))} className="rounded text-primary-600" id="active" />
                <label htmlFor="active" className="text-sm text-slate-700">Compte actif</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={handleSave} className="flex-1 btn-primary">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
