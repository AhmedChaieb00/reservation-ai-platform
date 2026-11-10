import { useState, useEffect } from 'react'
import { Search, Plus, MapPin, Users, Layers, X, Star, ChevronRight, Filter } from 'lucide-react'
import { getRooms, createRoom, updateRoom, deleteRoom } from '@/services/api'
import type { Room } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const equipIcons: Record<string, { e: string; label: string }> = {
  PROJECTOR:          { e: '📽️', label: 'Projecteur' },
  MICROPHONE:         { e: '🎤', label: 'Micro' },
  WHITEBOARD:         { e: '📋', label: 'Tableau' },
  VIDEO_CONFERENCE:   { e: '📹', label: 'Visio' },
  INTERACTIVE_SCREEN: { e: '🖥️', label: 'Écran' },
  OTHER:              { e: '⚙️', label: 'Autre' },
}

const gradients = [
  'from-iteam-700 to-iteam-500',
  'from-navy-700 to-navy-500',
  'from-iteam-800 to-navy-700',
  'from-navy-600 to-iteam-600',
  'from-iteam-600 to-iteam-400',
  'from-navy-800 to-iteam-700',
]

const capacityFilters = [
  { label: 'Tous',      min: 0   },
  { label: '< 15 pl.',  min: 0,  max: 15 },
  { label: '15–30 pl.', min: 15, max: 30 },
  { label: '> 30 pl.',  min: 30  },
]

export default function Rooms() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [rooms,     setRooms]     = useState<Room[]>([])
  const [search,    setSearch]    = useState('')
  const [capFilter, setCapFilter] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editRoom,  setEditRoom]  = useState<Partial<Room> | null>(null)

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    getRooms().then(setRooms).catch(() => toast.error('Erreur de chargement')).finally(() => setLoading(false))
  }, [])

  const f = capacityFilters[capFilter]
  const filtered = rooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || (r.location||'').toLowerCase().includes(search.toLowerCase())
    const matchCap = (!f.min || r.capacity >= f.min) && (!f.max || r.capacity < f.max)
    return matchSearch && matchCap
  })

  const handleSave = async () => {
    try {
      if (editRoom?.id) {
        const u = await updateRoom(editRoom.id, editRoom)
        setRooms(p => p.map(r => r.id === u.id ? u : r))
        toast.success('Salle modifiée')
      } else {
        const c = await createRoom(editRoom || {})
        setRooms(p => [...p, c])
        toast.success('Salle créée')
      }
      setShowModal(false); setEditRoom(null)
    } catch { toast.error('Erreur lors de la sauvegarde') }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('Désactiver cette salle ?')) return
    try { await deleteRoom(id); setRooms(p => p.filter(r => r.id !== id)); toast.success('Salle désactivée') }
    catch { toast.error('Erreur') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-[3px] border-iteam-200 border-t-iteam-600 rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-4 max-w-lg mx-auto lg:max-w-none">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Salles</h1>
          <p className="page-subtitle">{rooms.length} espace{rooms.length!==1?'s':''} disponible{rooms.length!==1?'s':''}</p>
        </div>
        {canManage && (
          <button onClick={() => { setEditRoom({}); setShowModal(true) }} className="btn-primary">
            <Plus size={16}/> <span className="hidden sm:inline">Ajouter</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input type="text" placeholder="Rechercher une salle…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 pr-9"/>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
      </div>

      {/* Capacity filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        <Filter size={14} className="text-gray-400 flex-shrink-0 self-center"/>
        {capacityFilters.map((f, i) => (
          <button key={i} onClick={() => setCapFilter(i)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${capFilter===i ? 'bg-iteam-600 text-white border-iteam-600 shadow-sm' : 'bg-white text-gray-600 border-warm-200 hover:border-iteam-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Rooms grid — 2 cols on mobile, 3 on md, 4 on xl */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(room => {
          const grad = gradients[room.id % gradients.length]
          const avail = room.equipment?.filter(e => e.status === 'AVAILABLE') ?? []
          return (
            <div key={room.id} className="card card-hover p-0 overflow-hidden flex flex-col active:scale-[0.98] transition-transform">
              {/* Card top */}
              <div className={`relative bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden`} style={{height: '100px'}}>
                <div className="absolute inset-0 opacity-10" style={{backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%),repeating-linear-gradient(-45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:'14px 14px'}}/>
                {room.floor !== undefined && room.floor !== null && (
                  <div className="absolute top-2 right-2 bg-white/20 border border-white/30 rounded-lg px-1.5 py-0.5 text-white text-[10px] font-bold flex items-center gap-0.5">
                    <Layers size={9}/> Ét.{room.floor}
                  </div>
                )}
                <div className="text-center text-white relative">
                  <div className="text-3xl font-black leading-none">{room.capacity}</div>
                  <div className="text-[10px] opacity-70 font-semibold uppercase tracking-widest">places</div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">{room.name}</h3>
                {room.location && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                    <MapPin size={10} className="text-iteam-400 flex-shrink-0"/><span className="truncate">{room.location}</span>
                  </div>
                )}

                {/* Equipment chips */}
                {avail.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {avail.slice(0,3).map(eq => (
                      <span key={eq.id} title={equipIcons[eq.type]?.label ?? eq.name} className="text-xs bg-warm-100 rounded-md px-1.5 py-0.5 select-none">
                        {equipIcons[eq.type]?.e ?? '⚙️'}
                      </span>
                    ))}
                    {avail.length > 3 && <span className="text-[10px] text-gray-400 self-center">+{avail.length-3}</span>}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-2.5">
                  {canManage ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditRoom(room); setShowModal(true) }} className="flex-1 text-[11px] py-1.5 rounded-lg border border-warm-200 hover:bg-warm-100 text-gray-600 font-medium transition-colors">Modifier</button>
                      <button onClick={() => handleDelete(room.id)} className="px-2 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 text-[11px] transition-colors">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => navigate('/reservations')} className="w-full btn-primary text-[11px] py-2 justify-center rounded-xl">
                      Réserver
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-3"><Search size={22} className="text-iteam-300"/></div>
          <p className="text-gray-500 font-semibold">Aucune salle trouvée</p>
          <p className="text-sm text-gray-400 mt-1">Essayez d'autres critères de recherche</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-iteam-700 to-iteam-600 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">{editRoom?.id ? 'Modifier la salle' : 'Nouvelle salle'}</h2>
                <p className="text-iteam-200 text-xs mt-0.5">Remplissez les informations</p>
              </div>
              <button onClick={() => { setShowModal(false); setEditRoom(null) }} className="text-white/60 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-3.5 max-h-[65vh] overflow-y-auto">
              {[
                { label: 'Nom de la salle', key: 'name',        type: 'text',   req: true,  ph: 'ex. Salle Atlas' },
                { label: 'Capacité (pers.)', key: 'capacity',   type: 'number', req: true,  ph: '20' },
                { label: 'Localisation',     key: 'location',   type: 'text',   req: false, ph: 'Bâtiment A, Aile Nord' },
                { label: 'Étage',            key: 'floor',      type: 'number', req: false, ph: '1' },
                { label: 'Surface (m²)',     key: 'surfaceArea', type: 'number', req: false, ph: '45' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label} {f.req && <span className="text-iteam-500">*</span>}</label>
                  <input type={f.type} placeholder={f.ph} value={(editRoom as Record<string,string|number|undefined>)?.[f.key]??''} onChange={e => setEditRoom(p => ({...p, [f.key]: f.type==='number' ? Number(e.target.value) : e.target.value}))} className="input-field"/>
                </div>
              ))}
              <div>
                <label className="label">Description</label>
                <textarea placeholder="Décrivez la salle…" value={editRoom?.description||''} onChange={e => setEditRoom(p => ({...p, description: e.target.value}))} className="input-field resize-none" rows={2}/>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-warm-100 bg-warm-50">
              <button onClick={() => { setShowModal(false); setEditRoom(null) }} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={handleSave} className="flex-1 btn-primary justify-center">{editRoom?.id ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
