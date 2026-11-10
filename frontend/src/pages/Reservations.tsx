// @ts-nocheck
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, Calendar, List, CheckCircle, XCircle, Clock, Filter, Building2, Users } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  getReservations, createReservation, confirmReservation,
  cancelReservation, getRooms, getEquipmentByRoom
} from '@/services/api'
import type { Reservation, Room, Equipment, CreateReservationRequest } from '@/types'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

const statusConfig: Record<string, { label: string; badge: string; calColor: string; dot: string }> = {
  PENDING:   { label: 'En attente', badge: 'badge badge-yellow', calColor: '#D97706', dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmée',  badge: 'badge badge-green',  calColor: '#059669', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Annulée',   badge: 'badge badge-red',    calColor: '#DC2626', dot: 'bg-red-400' },
  COMPLETED: { label: 'Terminée',  badge: 'badge badge-gray',   calColor: '#9CA3AF', dot: 'bg-gray-300' },
}

const filterOptions = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING',   label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'CANCELLED', label: 'Annulées' },
  { value: 'COMPLETED', label: 'Terminées' },
]

export default function Reservations() {
  const { user } = useAuthStore()
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Partial<CreateReservationRequest>>({
    recurrenceType: 'NONE', participantsCount: 1, equipmentIds: []
  })

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    Promise.all([getReservations(), getRooms()])
      .then(([r, rm]) => { setReservations(r); setRooms(rm) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (form.roomId) getEquipmentByRoom(form.roomId).then(setEquipment).catch(() => {})
  }, [form.roomId])

  const filtered = reservations.filter(r => statusFilter === 'ALL' || r.status === statusFilter)

  const calendarEvents = reservations.map(r => ({
    id: String(r.id),
    title: `${r.title}`,
    start: r.startTime,
    end: r.endTime,
    backgroundColor: statusConfig[r.status]?.calColor ?? '#8B1A2D',
    borderColor: 'transparent',
    extendedProps: { room: r.roomName, status: r.status },
  }))

  const handleCreate = async () => {
    if (!form.roomId || !form.title || !form.startTime || !form.endTime) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    try {
      const created = await createReservation(form as CreateReservationRequest)
      setReservations(prev => [created, ...prev])
      setShowModal(false)
      setForm({ recurrenceType: 'NONE', participantsCount: 1, equipmentIds: [] })
      toast.success('Réservation créée avec succès')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la création'
      toast.error(msg)
    }
  }

  const handleConfirm = async (id: number) => {
    try {
      const updated = await confirmReservation(id)
      setReservations(prev => prev.map(r => r.id === id ? updated : r))
      toast.success('Réservation confirmée')
    } catch { toast.error('Erreur') }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Annuler cette réservation ?')) return
    try {
      await cancelReservation(id)
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r))
      toast.success('Réservation annulée')
    } catch { toast.error('Erreur') }
  }

  const toggleEquipment = (id: number) => {
    setForm(prev => ({
      ...prev,
      equipmentIds: prev.equipmentIds?.includes(id)
        ? prev.equipmentIds.filter(e => e !== id)
        : [...(prev.equipmentIds || []), id]
    }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-[3px] border-iteam-200 border-t-iteam-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Réservations</h1>
          <p className="page-subtitle">{reservations.length} réservation{reservations.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-warm-100 rounded-xl p-1 border border-warm-200">
            {(['calendar', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === v
                    ? 'bg-white shadow text-iteam-700 border border-warm-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v === 'calendar' ? <><Calendar size={14} /> Calendrier</> : <><List size={14} /> Liste</>}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Réserver
          </button>
        </div>
      </div>

      {/* ── Status legend + filter ────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {view === 'list' && (
          <>
            <Filter size={14} className="text-gray-400" />
            {filterOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === value
                    ? 'bg-iteam-600 text-white border-iteam-600 shadow-sm'
                    : 'bg-white text-gray-600 border-warm-200 hover:border-iteam-300 hover:text-iteam-600'
                }`}
              >
                {label}
              </button>
            ))}
          </>
        )}
        {view === 'calendar' && (
          <div className="flex items-center gap-4">
            {Object.entries(statusConfig).map(([k, { label, calColor, dot }]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                <span className="text-xs text-gray-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Calendar View ─────────────────────────────────── */}
      {view === 'calendar' && (
        <div className="card p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={calendarEvents}
            locale="fr"
            buttonText={{ today: "Aujourd'hui", month: 'Mois', week: 'Semaine', day: 'Jour' }}
            height={580}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            nowIndicator
            businessHours={{ daysOfWeek: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '18:00' }}
            eventContent={(arg) => (
              <div className="px-1.5 py-0.5 overflow-hidden">
                <div className="font-semibold text-white text-[11px] truncate leading-tight">{arg.event.title}</div>
                {arg.event.extendedProps.room && (
                  <div className="text-white/70 text-[10px] truncate">{arg.event.extendedProps.room}</div>
                )}
              </div>
            )}
          />
        </div>
      )}

      {/* ── List View ─────────────────────────────────────── */}
      {view === 'list' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-warm-200 bg-warm-50">
                {['Réservation', 'Salle', 'Date & Heure', 'Participants', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {filtered.map(r => {
                const cfg = statusConfig[r.status]
                return (
                  <tr key={r.id} className="hover:bg-warm-50 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-iteam-700 transition-colors">{r.title}</div>
                          {r.description && <div className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{r.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Building2 size={13} className="text-iteam-400" />
                        {r.roomName}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-medium text-gray-800">
                        {format(new Date(r.startTime), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">
                        {format(new Date(r.startTime), 'HH:mm')} – {format(new Date(r.endTime), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users size={13} className="text-gray-400" />
                        {r.participantsCount}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cfg.badge}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {canManage && r.status === 'PENDING' && (
                          <button onClick={() => handleConfirm(r.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Confirmer">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {(r.status === 'PENDING' || r.status === 'CONFIRMED') &&
                          (canManage || r.userId === user?.id) && (
                          <button onClick={() => handleCancel(r.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Annuler">
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
                <Clock size={20} className="text-iteam-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">Aucune réservation trouvée</p>
              <p className="text-xs text-gray-400 mt-1">Modifiez les filtres ou créez une nouvelle réservation</p>
            </div>
          )}
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal header */}
            <div className="bg-gradient-to-r from-iteam-700 to-iteam-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-white text-base">Nouvelle réservation</h2>
                <p className="text-iteam-200 text-xs mt-0.5">Sélectionnez une salle et un créneau</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="label">Titre de la réunion <span className="text-iteam-500">*</span></label>
                <input
                  type="text"
                  placeholder="ex. Réunion équipe développement"
                  value={form.title || ''}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Salle <span className="text-iteam-500">*</span></label>
                <select
                  value={form.roomId || ''}
                  onChange={e => setForm(p => ({ ...p, roomId: Number(e.target.value) }))}
                  className="input-field"
                >
                  <option value="">Sélectionner une salle…</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} — {r.capacity} personnes</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Début <span className="text-iteam-500">*</span></label>
                  <input type="datetime-local" value={form.startTime || ''} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Fin <span className="text-iteam-500">*</span></label>
                  <input type="datetime-local" value={form.endTime || ''} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Participants</label>
                  <input type="number" min={1} value={form.participantsCount || 1} onChange={e => setForm(p => ({ ...p, participantsCount: Number(e.target.value) }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Récurrence</label>
                  <select value={form.recurrenceType || 'NONE'} onChange={e => setForm(p => ({ ...p, recurrenceType: e.target.value as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' }))} className="input-field">
                    <option value="NONE">Aucune</option>
                    <option value="DAILY">Quotidienne</option>
                    <option value="WEEKLY">Hebdomadaire</option>
                    <option value="MONTHLY">Mensuelle</option>
                  </select>
                </div>
              </div>

              {equipment.length > 0 && (
                <div>
                  <label className="label">Équipements souhaités</label>
                  <div className="grid grid-cols-2 gap-2">
                    {equipment.map(eq => (
                      <label key={eq.id} className="flex items-center gap-2.5 p-2.5 border border-warm-200 rounded-xl cursor-pointer hover:bg-iteam-50 hover:border-iteam-300 transition-all">
                        <input
                          type="checkbox"
                          checked={form.equipmentIds?.includes(eq.id) || false}
                          onChange={() => toggleEquipment(eq.id)}
                          className="accent-iteam-600 rounded"
                        />
                        <span className="text-sm text-gray-700 font-medium">{eq.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Description</label>
                <textarea
                  placeholder="Objectif de la réunion, participants attendus…"
                  value={form.description || ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-warm-100 bg-warm-50 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={handleCreate} className="flex-1 btn-primary justify-center">
                Créer la réservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
