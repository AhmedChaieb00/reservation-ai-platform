import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, CheckCircle, Wrench, X } from 'lucide-react'
import { getEquipment, getRooms, reportEquipmentIssue, createEquipment } from '@/services/api'
import type { Equipment as EquipmentType, Room } from '@/types'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const statusConfig = {
  AVAILABLE:    { label: 'Disponible',      class: 'bg-green-100 text-green-700' },
  IN_USE:       { label: 'En utilisation',  class: 'bg-blue-100 text-blue-700' },
  MAINTENANCE:  { label: 'En maintenance',  class: 'bg-yellow-100 text-yellow-700' },
  OUT_OF_ORDER: { label: 'Hors service',    class: 'bg-red-100 text-red-700' },
}

const typeLabels: Record<string, string> = {
  PROJECTOR: 'Projecteur', MICROPHONE: 'Microphone', WHITEBOARD: 'Tableau blanc',
  VIDEO_CONFERENCE: 'Visioconférence', INTERACTIVE_SCREEN: 'Écran interactif', OTHER: 'Autre',
}

const typeEmoji: Record<string, string> = {
  PROJECTOR: '📽️', MICROPHONE: '🎤', WHITEBOARD: '📋',
  VIDEO_CONFERENCE: '📹', INTERACTIVE_SCREEN: '🖥️', OTHER: '⚙️',
}

export default function Equipment() {
  const { user } = useAuthStore()
  const [rooms, setRooms] = useState<Room[]>([])
  const [allEquipment, setAllEquipment] = useState<EquipmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [reportModal, setReportModal] = useState<{ id: number; name: string } | null>(null)
  const [reportDesc, setReportDesc] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEq, setNewEq] = useState<Partial<EquipmentType>>({ status: 'AVAILABLE' })

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    Promise.all([getRooms(), getEquipment()])
      .then(([rm, eq]) => { setRooms(rm); setAllEquipment(eq) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleReport = async () => {
    if (!reportDesc.trim() || !reportModal) return
    try {
      await reportEquipmentIssue(reportModal.id, reportDesc)
      setAllEquipment(prev => prev.map(e => e.id === reportModal.id ? { ...e, status: 'MAINTENANCE' as const } : e))
      setReportModal(null)
      setReportDesc('')
      toast.success('Problème signalé')
    } catch { toast.error('Erreur') }
  }

  const handleAdd = async () => {
    try {
      const created = await createEquipment(newEq)
      setAllEquipment(prev => [...prev, created])
      setShowAddModal(false)
      setNewEq({ status: 'AVAILABLE' })
      toast.success('Équipement ajouté')
    } catch { toast.error('Erreur') }
  }

  // Build equipment id set for "assigned" tracking
  const assignedIds = new Set(rooms.flatMap(r => (r.equipment || []).map(e => e.id)))
  const unassigned = allEquipment.filter(eq => !assignedIds.has(eq.id))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des équipements</h1>
          <p className="text-slate-500">{allEquipment.length} équipement(s) au total</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Ajouter
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="card p-4 flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.class}`}>{config.label}</span>
            <span className="text-xl font-bold">{allEquipment.filter(e => e.status === status).length}</span>
          </div>
        ))}
      </div>

      {/* Equipment grouped by room (from rooms endpoint which includes equipment) */}
      {rooms.filter(r => (r.equipment || []).length > 0).map(room => (
        <div key={room.id} className="card">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-primary-100 rounded text-primary-600 text-xs flex items-center justify-center font-bold">
              {room.floor ?? 0}
            </span>
            {room.name}
            <span className="text-sm text-slate-400">— {room.location}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(room.equipment || []).map(eq => {
              // Use latest status from allEquipment if available
              const live = allEquipment.find(e => e.id === eq.id) || eq
              return (
                <EquipmentCard key={eq.id} eq={live} onReport={() => setReportModal({ id: eq.id, name: eq.name })} />
              )
            })}
          </div>
        </div>
      ))}

      {unassigned.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Non assignés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unassigned.map(eq => (
              <EquipmentCard key={eq.id} eq={eq} onReport={() => setReportModal({ id: eq.id, name: eq.name })} />
            ))}
          </div>
        </div>
      )}

      {rooms.every(r => (r.equipment || []).length === 0) && unassigned.length === 0 && (
        <div className="card p-8 text-center text-slate-400">Aucun équipement trouvé.</div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" />
                Signaler un problème
              </h3>
              <button onClick={() => setReportModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">Équipement : <strong>{reportModal.name}</strong></p>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder="Décrivez le problème..."
              className="input-field resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button onClick={() => setReportModal(null)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={handleReport} className="flex-1 btn-danger">Signaler</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && canManage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Nouvel équipement</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Nom</label>
                <input type="text" value={newEq.name || ''} onChange={e => setNewEq(p => ({ ...p, name: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={newEq.type || ''} onChange={e => setNewEq(p => ({ ...p, type: e.target.value as EquipmentType['type'] }))} className="input-field">
                  <option value="">Sélectionner</option>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Salle</label>
                <select value={newEq.roomId || ''} onChange={e => setNewEq(p => ({ ...p, roomId: Number(e.target.value) || undefined }))} className="input-field">
                  <option value="">Non assigné</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Numéro de série</label>
                <input type="text" value={newEq.serialNumber || ''} onChange={e => setNewEq(p => ({ ...p, serialNumber: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={handleAdd} className="flex-1 btn-primary">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EquipmentCard({ eq, onReport }: { eq: EquipmentType; onReport: () => void }) {
  const config = statusConfig[eq.status] ?? { label: eq.status, class: 'bg-gray-100 text-gray-700' }
  return (
    <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
        {typeEmoji[eq.type] ?? '⚙️'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-slate-800 truncate">{eq.name}</div>
        <div className="text-xs text-slate-500">{typeLabels[eq.type] || eq.type}</div>
        {eq.serialNumber && <div className="text-xs text-slate-400">S/N: {eq.serialNumber}</div>}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.class}`}>{config.label}</span>
        {eq.status !== 'OUT_OF_ORDER' && eq.status !== 'MAINTENANCE' && (
          <button onClick={onReport} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
            <Wrench size={10} /> Signaler
          </button>
        )}
        {(eq.status === 'AVAILABLE' || eq.status === 'IN_USE') && (
          <CheckCircle size={12} className="text-green-500" />
        )}
      </div>
    </div>
  )
}
