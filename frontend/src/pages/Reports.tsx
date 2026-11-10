import { useState, useEffect } from 'react'
import { BarChart3, Download, TrendingUp, Users, Building2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { getDashboardStats, getOccupancyStats, getPeakHours, getUserActivityStats } from '@/services/api'
import toast from 'react-hot-toast'

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Reports() {
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [occupancy, setOccupancy] = useState<Array<{ roomName: string; totalReservations: number; occupancyRate: number }>>([])
  const [peakHours, setPeakHours] = useState<Array<{ hour: string; count: number }>>([])
  const [userActivity, setUserActivity] = useState<Array<{ userName: string; totalReservations: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getDashboardStats(), getOccupancyStats(), getPeakHours(), getUserActivityStats()])
      .then(([s, occ, peak, users]) => {
        if (s.status === 'fulfilled') setStats(s.value as unknown as Record<string, number>)
        if (occ.status === 'fulfilled')
          setOccupancy((occ.value as { roomOccupancy: Array<{ roomName: string; totalReservations: number; occupancyRate: number }> }).roomOccupancy || [])
        if (peak.status === 'fulfilled')
          setPeakHours((peak.value as { peakHours: Array<{ hour: string; count: number }> }).peakHours || [])
        if (users.status === 'fulfilled')
          setUserActivity((users.value as { userActivity: Array<{ userName: string; totalReservations: number }> }).userActivity || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const statusData = stats ? [
    { name: 'Confirmées', value: stats.confirmedReservations || 0 },
    { name: 'En attente', value: stats.pendingReservations || 0 },
    { name: 'Annulées', value: stats.cancelledReservations || 0 },
  ] : []

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rapports & Statistiques</h1>
          <p className="text-slate-500">Analyse de l'utilisation des salles</p>
        </div>
        <button
          onClick={() => toast.success('Export en cours de développement')}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={16} /> Exporter
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total réservations', value: stats?.totalReservations || 0, icon: BarChart3, color: 'text-primary-600 bg-primary-50' },
          { label: 'Salles actives', value: stats?.totalRooms || 0, icon: Building2, color: 'text-green-600 bg-green-50' },
          { label: 'Utilisateurs', value: stats?.activeUsers || 0, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: "Taux d'occupation", value: `${stats?.occupancyRate || 0}%`, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy per room */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Utilisation par salle</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={occupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="roomName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="totalReservations" name="Réservations" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Distribution des statuts</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Peak hours */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Heures de pointe</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Réservations" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User activity */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Activité par utilisateur</h2>
          <div className="space-y-3">
            {userActivity.slice(0, 7).map((user, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{user.userName}</div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(user.totalReservations / (userActivity[0]?.totalReservations || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-600">{user.totalReservations}</span>
              </div>
            ))}
            {userActivity.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Pas de données disponibles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
