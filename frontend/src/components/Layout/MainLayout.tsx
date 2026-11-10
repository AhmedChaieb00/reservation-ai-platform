import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Building2, CalendarDays, MessageSquare, User,
  BarChart3, Users, Bell, LogOut, ChevronLeft, ChevronRight,
  Check, CheckCheck, X, Plus, Settings, Cpu
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api'
import type { Notification } from '@/types'
import AiChatbot from '@/components/Chatbot/AiChatbot'

/* ── Bottom nav tabs (mobile / PWA) ─────────────────────────── */
const userTabs = [
  { to: '/dashboard',    icon: Home,         label: 'Accueil' },
  { to: '/rooms',        icon: Building2,    label: 'Salles'  },
  { to: '/reservations', icon: CalendarDays, label: 'Agenda', center: true },
  { to: '/equipment',   icon: Cpu,          label: 'Matériel' },
  { to: '/profile',     icon: User,         label: 'Profil'  },
]
const managerTabs = [
  { to: '/dashboard',    icon: Home,         label: 'Accueil' },
  { to: '/rooms',        icon: Building2,    label: 'Salles'  },
  { to: '/reservations', icon: CalendarDays, label: 'Agenda', center: true },
  { to: '/reports',     icon: BarChart3,    label: 'Rapports' },
  { to: '/profile',     icon: User,         label: 'Profil'  },
]
const adminTabs = [
  { to: '/dashboard',    icon: Home,         label: 'Accueil' },
  { to: '/rooms',        icon: Building2,    label: 'Salles'  },
  { to: '/reservations', icon: CalendarDays, label: 'Agenda', center: true },
  { to: '/admin/users', icon: Users,        label: 'Membres' },
  { to: '/profile',     icon: User,         label: 'Profil'  },
]

/* ── Sidebar nav (desktop, admin/manager) ───────────────────── */
const sidebarNav = [
  { to: '/dashboard',    icon: Home,         label: 'Tableau de bord', roles: ['USER','MANAGER','ADMIN'] },
  { to: '/rooms',        icon: Building2,    label: 'Salles',           roles: ['USER','MANAGER','ADMIN'] },
  { to: '/reservations', icon: CalendarDays, label: 'Réservations',     roles: ['USER','MANAGER','ADMIN'] },
  { to: '/equipment',   icon: Cpu,          label: 'Équipements',      roles: ['USER','MANAGER','ADMIN'] },
  { to: '/reports',     icon: BarChart3,    label: 'Rapports',         roles: ['MANAGER','ADMIN'] },
  { to: '/admin/users', icon: Users,        label: 'Utilisateurs',     roles: ['ADMIN'] },
]

const typeLabel: Record<string,string> = {
  CONFIRMATION:'Confirmation', REMINDER:'Rappel',
  CANCELLATION:'Annulation', MODIFICATION:'Modification', ADMIN_ALERT:'Alerte',
}
const typeColor: Record<string,string> = {
  CONFIRMATION:'text-emerald-600', REMINDER:'text-navy-600',
  CANCELLATION:'text-red-600', MODIFICATION:'text-amber-600', ADMIN_ALERT:'text-iteam-600',
}
const roleColor: Record<string,string> = {
  ADMIN:'bg-gold-500/20 text-gold-300', MANAGER:'bg-white/10 text-blue-200', USER:'bg-white/10 text-white/60',
}
const roleLabel: Record<string,string> = { ADMIN:'Administrateur', MANAGER:'Responsable', USER:'Utilisateur' }

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [unread,    setUnread]    = useState(0)
  const [notifs,    setNotifs]    = useState<Notification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const role = user?.role ?? 'USER'
  const tabs = role === 'ADMIN' ? adminTabs : role === 'MANAGER' ? managerTabs : userTabs
  const initials = `${user?.firstName?.[0]??''}${user?.lastName?.[0]??''}`.toUpperCase()

  const fetchNotifs = () =>
    getNotifications()
      .then((d: { unreadCount?: number; notifications?: Notification[] }) => {
        setUnread(d.unreadCount ?? 0)
        setNotifs(d.notifications ?? [])
      }).catch(() => {})

  useEffect(() => { fetchNotifs(); const t = setInterval(fetchNotifs, 60000); return () => clearInterval(t) }, [])

  useEffect(() => {
    if (!showNotifs) return
    const h = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowNotifs(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showNotifs])

  const markRead = async (id: number) => {
    await markNotificationRead(id).catch(() => {})
    setNotifs(p => p.map(n => n.id === id ? {...n, isRead: true} : n))
    setUnread(p => Math.max(0, p - 1))
  }
  const markAll = async () => {
    await markAllNotificationsRead().catch(() => {})
    setNotifs(p => p.map(n => ({...n, isRead: true})))
    setUnread(0)
  }

  /* ── Notification panel (shared) ── */
  const NotifPanel = () => (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-warm-200 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-iteam-700 to-iteam-600">
        <span className="font-semibold text-sm text-white flex items-center gap-2">
          <Bell size={14}/> Notifications
          {unread > 0 && <span className="bg-gold-400 text-iteam-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
        </span>
        <div className="flex items-center gap-2">
          {unread > 0 && <button onClick={markAll} className="text-white/70 hover:text-white text-xs flex items-center gap-1"><CheckCheck size={12}/> Tout lire</button>}
          <button onClick={() => setShowNotifs(false)} className="text-white/50 hover:text-white"><X size={14}/></button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-warm-100">
        {notifs.length === 0
          ? <div className="py-10 text-center"><Bell size={24} className="mx-auto text-gray-300 mb-2"/><p className="text-sm text-gray-400">Aucune notification</p></div>
          : notifs.map(n => (
            <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-warm-50 ${!n.isRead ? 'bg-iteam-50/50' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-iteam-500' : 'bg-gray-200'}`}/>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold mb-0.5 ${typeColor[n.type]||'text-gray-600'}`}>{typeLabel[n.type]||n.type}</div>
                <div className="text-sm text-gray-700 leading-snug">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.sentAt).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              {!n.isRead && <button onClick={() => markRead(n.id)} className="text-gray-300 hover:text-iteam-500 flex-shrink-0 mt-1"><Check size={14}/></button>}
            </div>
          ))
        }
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-warm-50 overflow-hidden">

      {/* ══ DESKTOP SIDEBAR (lg+) ═════════════════════════════ */}
      <aside className={`hidden lg:flex ${collapsed?'w-[60px]':'w-60'} flex-col flex-shrink-0 transition-all duration-200 bg-gradient-to-b from-iteam-800 via-iteam-700 to-iteam-600 relative`}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{backgroundImage:`repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%),repeating-linear-gradient(-45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)`,backgroundSize:'20px 20px'}}/>

        {/* Brand */}
        <div className={`relative flex items-center h-16 px-3 border-b border-white/10 ${collapsed?'justify-center':'gap-3'}`}>
          <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden border border-white/20 bg-white/10">
            <img src="/logo-iteam.png" alt="ITEAM" className="w-full h-full object-contain p-0.5"/>
          </div>
          {!collapsed && <div><div className="text-white text-sm font-bold tracking-wide">ITEAM</div><div className="text-gold-300 text-[10px] font-medium uppercase tracking-wider">Réservation</div></div>}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {sidebarNav.filter(i => i.roles.includes(role)).map(({to, icon: Icon, label}) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined}
              className={({isActive}) =>
                `group flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm transition-all border-l-2
                ${isActive ? 'bg-white/15 text-white border-gold-400 pl-[9px]' : 'text-white/60 hover:text-white hover:bg-white/10 border-transparent'}
                ${collapsed ? 'justify-center' : ''}`
              }
            >
              {({isActive}) => <><Icon size={16} className={`flex-shrink-0 ${isActive?'text-gold-300':'text-white/50 group-hover:text-white/80'}`}/>{!collapsed && <span className="font-medium truncate">{label}</span>}</>}
            </NavLink>
          ))}
        </nav>

        <div className="relative mx-3 border-t border-white/10"/>
        <div className="relative p-2 space-y-1 pb-3">
          <NavLink to="/profile" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <div className="w-7 h-7 rounded-full bg-gold-500/30 border border-gold-400/40 flex items-center justify-center text-gold-200 text-[11px] font-bold flex-shrink-0">{initials}</div>
            {!collapsed && <div className="overflow-hidden min-w-0"><div className="text-white text-xs font-semibold truncate">{user?.firstName} {user?.lastName}</div><span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColor[role]}`}>{roleLabel[role]}</span></div>}
          </NavLink>
          <button onClick={() => { logout(); navigate('/login') }} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/50 hover:text-red-300 hover:bg-red-900/20 transition-all w-full text-sm ${collapsed?'justify-center':''}`}>
            <LogOut size={14}/>{!collapsed && <span>Déconnexion</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all w-full text-sm ${collapsed?'justify-center':''}`}>
            {collapsed ? <ChevronRight size={14}/> : <><ChevronLeft size={14}/><span>Réduire</span></>}
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar (both mobile + desktop) */}
        <header className="h-14 bg-white border-b border-warm-200 flex items-center justify-between px-4 flex-shrink-0 shadow-sm z-20">
          {/* Mobile: logo + brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-iteam-50 border border-iteam-100 lg:hidden">
              <img src="/logo-iteam.png" alt="ITEAM" className="w-full h-full object-contain p-0.5"/>
            </div>
            <div className="lg:hidden">
              <div className="text-sm font-bold text-iteam-700 leading-tight">ITEAM</div>
              <div className="text-[9px] text-gray-400 leading-tight uppercase tracking-wider">Réservation</div>
            </div>
            {/* Desktop: page title */}
            <div className="hidden lg:block text-sm font-semibold text-iteam-700">
              {sidebarNav.find(n => location.pathname.startsWith(n.to))?.label ?? 'ITEAM'}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Bell */}
            <div ref={bellRef} className="relative">
              <button onClick={() => { if(!showNotifs) fetchNotifs(); setShowNotifs(p=>!p) }}
                className="relative p-2 rounded-xl text-gray-500 hover:text-iteam-700 hover:bg-iteam-50 transition-all">
                <Bell size={18}/>
                {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-iteam-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unread>9?'9+':unread}</span>}
              </button>
              {showNotifs && <NotifPanel/>}
            </div>

            {/* Avatar / profile link */}
            <NavLink to="/profile" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-iteam-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-iteam-600 flex items-center justify-center text-white text-xs font-bold border-2 border-iteam-300">{initials}</div>
              <span className="text-sm text-gray-700 font-medium hidden sm:block">{user?.firstName}</span>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="p-4 sm:p-6 max-w-2xl mx-auto lg:max-w-7xl">
            <Outlet/>
          </div>
        </main>
      </div>

      {/* ══ BOTTOM NAV (mobile/PWA only) ═══════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-warm-200 safe-area-pb">
        <div className="flex items-end justify-around px-1 h-16">
          {tabs.map(({ to, icon: Icon, label, center }) =>
            center ? (
              /* Center FAB */
              <div key={to} className="flex flex-col items-center -mt-5">
                <button
                  onClick={() => navigate(to)}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-iteam-600 to-iteam-800 flex items-center justify-center shadow-lg shadow-iteam-900/30 active:scale-95 transition-transform"
                >
                  <Plus size={26} className="text-white"/>
                </button>
                <span className="text-[10px] text-gray-400 font-medium mt-1">Réserver</span>
              </div>
            ) : (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 pt-2 pb-1 gap-0.5 transition-colors
                  ${isActive ? 'text-iteam-700' : 'text-gray-400 hover:text-gray-600'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative w-10 h-7 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-iteam-50' : ''}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8}/>
                      {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-iteam-600"/>}
                    </div>
                    <span className="text-[10px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </div>
      </nav>

      <AiChatbot/>
    </div>
  )
}
