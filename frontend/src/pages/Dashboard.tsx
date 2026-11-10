import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CalendarDays, Users, Clock, TrendingUp, CheckCircle,
  ChevronRight, Sparkles, MapPin, AlertCircle, RefreshCw, BookOpen
} from 'lucide-react'
import { getDashboardStats, getTodayReservations } from '@/services/api'
import type { DashboardStats, Reservation } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { format, isToday, isTomorrow, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const statusConfig: Record<string, { label: string; dot: string; bg: string }> = {
  PENDING:   { label: 'En attente', dot: 'bg-amber-400',   bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Confirmée',  dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Annulée',   dot: 'bg-red-400',     bg: 'bg-red-50 text-red-600 border-red-200' },
  COMPLETED: { label: 'Terminée',  dot: 'bg-gray-300',    bg: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function relativeDay(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return "Aujourd'hui"
  if (isTomorrow(d)) return 'Demain'
  if (d < addDays(new Date(), 7)) return format(d, 'EEEE', { locale: fr })
  return format(d, 'd MMM', { locale: fr })
}

interface StatPillProps { label: string; value: string|number; icon: React.ElementType; color: string }
function StatPill({ label, value, icon: Icon, color }: StatPillProps) {
  return (
    <div className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-20 rounded-2xl ${color} gap-1`}>
      <Icon size={18} strokeWidth={2}/>
      <div className="text-xl font-black leading-none">{value}</div>
      <div className="text-[10px] font-semibold text-center leading-tight px-1">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [reservs, setReservs] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([getDashboardStats(), getTodayReservations()])
      .then(([s, r]) => { setStats(s); setReservs(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refresh])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-[3px] border-iteam-200 border-t-iteam-600 rounded-full animate-spin"/>
      <span className="text-sm text-gray-400">Chargement…</span>
    </div>
  )

  const upcoming = reservs
    .filter(r => r.status !== 'CANCELLED' && r.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  return (
    <div className="space-y-5 max-w-lg mx-auto lg:max-w-none">

      {/* ── Hero greeting ─────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-iteam-800 via-iteam-700 to-iteam-500">
        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:`radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px),radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)`,backgroundSize:'24px 24px'}}/>
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/5 blur-2xl"/>
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-gold-400/10 blur-3xl"/>

        <div className="relative px-5 pt-5 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"/>
                <span className="text-gold-300 text-xs font-semibold uppercase tracking-widest">ITEAM University</span>
              </div>
              <h1 className="text-white text-2xl font-black leading-tight mt-1">
                {greeting},<br/>{user?.firstName} 👋
              </h1>
              <p className="text-white/60 text-sm mt-1 capitalize">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <button onClick={() => setRefresh(r => r+1)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95">
              <RefreshCw size={16} className="text-white/80"/>
            </button>
          </div>

          {/* Quick insight */}
          {(stats?.pendingReservations ?? 0) > 0 && (user?.role === 'ADMIN' || user?.role === 'MANAGER') ? (
            <div className="mt-4 bg-amber-400/20 border border-amber-300/30 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="text-amber-300 flex-shrink-0"/>
                <div>
                  <p className="text-white text-sm font-semibold">{stats?.pendingReservations} à valider</p>
                  <p className="text-white/60 text-xs">Réservation{(stats?.pendingReservations??0)>1?'s':''} en attente</p>
                </div>
              </div>
              <button onClick={() => navigate('/reservations')} className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
                Voir
              </button>
            </div>
          ) : upcoming.length > 0 ? (
            <div className="mt-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <CalendarDays size={16} className="text-gold-300 flex-shrink-0"/>
              <div>
                <p className="text-white text-sm font-semibold truncate">{upcoming[0].title}</p>
                <p className="text-white/60 text-xs">{relativeDay(upcoming[0].startTime)} · {format(new Date(upcoming[0].startTime), 'HH:mm')} · {upcoming[0].roomName}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <Sparkles size={16} className="text-gold-300"/>
              <p className="text-white/80 text-sm">Aucune réservation à venir — <button onClick={() => navigate('/reservations')} className="text-gold-300 font-semibold underline underline-offset-2">Réserver</button></p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat pills (horizontal scroll) ────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Vue d'ensemble</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          <StatPill label="Salles"       value={stats?.totalRooms??0}          icon={Building2}    color="bg-iteam-50 text-iteam-700"/>
          <StatPill label="Aujourd'hui"  value={stats?.todayReservations??0}   icon={CalendarDays} color="bg-navy-50 text-navy-700"/>
          <StatPill label="En attente"   value={stats?.pendingReservations??0} icon={Clock}        color="bg-amber-50 text-amber-700"/>
          <StatPill label="Confirmées"   value={stats?.confirmedReservations??0} icon={CheckCircle} color="bg-emerald-50 text-emerald-700"/>
          <StatPill label="Occupation"   value={`${stats?.occupancyRate??0}%`} icon={TrendingUp}   color="bg-violet-50 text-violet-700"/>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') &&
            <StatPill label="Membres"    value={stats?.activeUsers??0}         icon={Users}        color="bg-rose-50 text-rose-700"/>
          }
        </div>
      </div>

      {/* ── Quick actions ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Réserver', icon: CalendarDays, to: '/reservations', color: 'from-iteam-600 to-iteam-700', text: 'white' },
          { label: 'Salles',   icon: Building2,    to: '/rooms',        color: 'from-navy-600 to-navy-700',   text: 'white' },
          { label: 'Assistant IA', icon: Sparkles, to: null,            color: 'from-gold-500 to-gold-600',   text: 'white', chatbot: true },
        ].map(({ label, icon: Icon, to, color, text }) => (
          <button
            key={label}
            onClick={() => { if (to) navigate(to) }}
            className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-gradient-to-br ${color} active:scale-95 transition-all shadow-sm`}
          >
            <Icon size={22} className={`text-${text}`}/>
            <span className={`text-${text} text-xs font-semibold`}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Upcoming reservations feed ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Prochaines réservations</h2>
          <button onClick={() => navigate('/reservations')} className="text-iteam-600 text-xs font-semibold flex items-center gap-1 hover:text-iteam-800">
            Tout voir <ChevronRight size={13}/>
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={20} className="text-iteam-300"/>
            </div>
            <p className="text-sm font-medium text-gray-500">Aucune réservation à venir</p>
            <button onClick={() => navigate('/reservations')} className="mt-3 btn-primary text-xs py-2 mx-auto">
              Créer une réservation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((r, i) => {
              const cfg = statusConfig[r.status]
              return (
                <div key={r.id} className={`card p-0 overflow-hidden ${i === 0 ? 'ring-1 ring-iteam-200' : ''}`}>
                  <div className="flex items-stretch">
                    {/* Date column */}
                    <div className={`flex-shrink-0 w-16 flex flex-col items-center justify-center py-3 px-2 ${i===0 ? 'bg-iteam-600' : 'bg-warm-100'}`}>
                      <div className={`text-xs font-bold uppercase ${i===0?'text-gold-300':'text-gray-500'}`}>
                        {format(new Date(r.startTime), 'EEE', {locale:fr})}
                      </div>
                      <div className={`text-2xl font-black leading-none ${i===0?'text-white':'text-gray-800'}`}>
                        {format(new Date(r.startTime), 'd')}
                      </div>
                      <div className={`text-[10px] ${i===0?'text-white/70':'text-gray-400'}`}>
                        {format(new Date(r.startTime), 'MMM', {locale:fr})}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 px-4 py-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate leading-tight">{r.title}</p>
                        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                        <MapPin size={11} className="text-iteam-400 flex-shrink-0"/>
                        <span className="truncate">{r.roomName}</span>
                        <span className="text-gray-300">·</span>
                        <Clock size={11} className="flex-shrink-0"/>
                        <span>{format(new Date(r.startTime),'HH:mm')} – {format(new Date(r.endTime),'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Manager/Admin shortcuts ────────────────────────── */}
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Administration</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Rapports & statistiques', icon: TrendingUp, to: '/reports', color: 'text-violet-700 bg-violet-50' },
              ...(user?.role === 'ADMIN' ? [{ label: 'Gérer les membres', icon: Users, to: '/admin/users', color: 'text-iteam-700 bg-iteam-50' }] : []),
            ].map(({ label, icon: Icon, to, color }) => (
              <button key={to} onClick={() => navigate(to)}
                className="card card-hover flex items-center gap-3 px-4 py-3.5 text-left">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={15}/>
                </div>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile nav */}
      <div className="h-2"/>
    </div>
  )
}
