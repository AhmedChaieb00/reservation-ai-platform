import axios from 'axios'
import type {
  AuthResponse, LoginRequest, RegisterRequest, Room, Reservation,
  CreateReservationRequest, Equipment, User, DashboardStats
} from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (data: LoginRequest) =>
  api.post<AuthResponse>('/auth/login', data).then(r => r.data)
export const register = (data: RegisterRequest) =>
  api.post<AuthResponse>('/auth/register', data).then(r => r.data)
export const getMe = () =>
  api.get<AuthResponse>('/auth/me').then(r => r.data)

// Rooms
export const getRooms = () =>
  api.get<Room[]>('/rooms').then(r => r.data)
export const getRoom = (id: number) =>
  api.get<Room>(`/rooms/${id}`).then(r => r.data)
export const getAvailableRooms = (startTime?: string, endTime?: string, capacity?: number) =>
  api.get<Room[]>('/rooms/available', { params: { startTime, endTime, capacity } }).then(r => r.data)
export const createRoom = (room: Partial<Room>) =>
  api.post<Room>('/rooms', room).then(r => r.data)
export const updateRoom = (id: number, room: Partial<Room>) =>
  api.put<Room>(`/rooms/${id}`, room).then(r => r.data)
export const deleteRoom = (id: number) =>
  api.delete(`/rooms/${id}`).then(r => r.data)

// Reservations
export const getReservations = () =>
  api.get<Reservation[]>('/reservations').then(r => r.data)
export const getReservation = (id: number) =>
  api.get<Reservation>(`/reservations/${id}`).then(r => r.data)
export const getCalendarEvents = (start: string, end: string, roomId?: number) =>
  api.get<Reservation[]>('/reservations/calendar', { params: { start, end, roomId } }).then(r => r.data)
export const getTodayReservations = () =>
  api.get<Reservation[]>('/reservations/today').then(r => r.data)
export const createReservation = (data: CreateReservationRequest) =>
  api.post<Reservation>('/reservations', data).then(r => r.data)
export const confirmReservation = (id: number) =>
  api.put<Reservation>(`/reservations/${id}/confirm`).then(r => r.data)
export const cancelReservation = (id: number) =>
  api.delete(`/reservations/${id}`).then(r => r.data)

// Equipment
export const getEquipment = () =>
  api.get<Equipment[]>('/equipment').then(r => r.data)
export const getEquipmentByRoom = (roomId: number) =>
  api.get<Equipment[]>(`/equipment/room/${roomId}`).then(r => r.data)
export const createEquipment = (eq: Partial<Equipment>) =>
  api.post<Equipment>('/equipment', eq).then(r => r.data)
export const updateEquipment = (id: number, eq: Partial<Equipment>) =>
  api.put<Equipment>(`/equipment/${id}`, eq).then(r => r.data)
export const deleteEquipment = (id: number) =>
  api.delete(`/equipment/${id}`).then(r => r.data)
export const reportEquipmentIssue = (id: number, description: string) =>
  api.post(`/equipment/${id}/report`, { description }).then(r => r.data)

// Users
export const getUsers = () =>
  api.get<User[]>('/users').then(r => r.data)
export const updateUser = (id: number, user: Partial<User>) =>
  api.put<User>(`/users/${id}`, user).then(r => r.data)
export const updateProfile = (user: Partial<User>) =>
  api.put<User>('/users/profile', user).then(r => r.data)
export const deleteUser = (id: number) =>
  api.delete(`/users/${id}`).then(r => r.data)

// Notifications
export const getNotifications = () =>
  api.get('/notifications').then(r => r.data)
export const markNotificationRead = (id: number) =>
  api.put(`/notifications/${id}/read`).then(r => r.data)
export const markAllNotificationsRead = () =>
  api.put('/notifications/read-all').then(r => r.data)

// Reports
export const getDashboardStats = () =>
  api.get<DashboardStats>('/reports/dashboard').then(r => r.data)
export const getOccupancyStats = () =>
  api.get('/reports/occupancy').then(r => r.data)
export const getPeakHours = () =>
  api.get('/reports/peak-hours').then(r => r.data)
export const getUserActivityStats = () =>
  api.get('/reports/user-activity').then(r => r.data)

// AI
export const getAiRecommendations = (data: object) =>
  api.post('/ai/recommend', data).then(r => r.data)
export const sendChatMessage = (message: string, userId?: number, sessionId?: string) =>
  api.post('/ai/chat', { message, userId, sessionId }).then(r => r.data)
export const getAiPredictions = (roomId?: number, weeks = 4) =>
  api.get('/ai/predict', { params: { roomId, weeks } }).then(r => r.data)
export const getAnomalies = () =>
  api.get('/ai/anomalies').then(r => r.data)

export default api
