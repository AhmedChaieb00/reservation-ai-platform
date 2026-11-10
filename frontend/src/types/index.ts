export type UserRole = 'USER' | 'MANAGER' | 'ADMIN'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  department?: string
  phone?: string
  isActive: boolean
  createdAt?: string
}

export type EquipmentType = 'PROJECTOR' | 'MICROPHONE' | 'WHITEBOARD' | 'VIDEO_CONFERENCE' | 'INTERACTIVE_SCREEN' | 'OTHER'
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_ORDER'

export interface Equipment {
  id: number
  name: string
  type: EquipmentType
  roomId?: number
  status: EquipmentStatus
  description?: string
  serialNumber?: string
  purchaseDate?: string
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface Reservation {
  id: number
  userId: number
  userName: string
  userEmail: string
  roomId: number
  roomName: string
  roomLocation?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  participantsCount: number
  status: ReservationStatus
  recurrenceType: RecurrenceType
  recurrenceEndDate?: string
  parentReservationId?: number
  equipmentList?: Array<{ id: number; name: string; type: EquipmentType; serialNumber?: string }>
  createdAt?: string
}

export interface Room {
  id: number
  name: string
  capacity: number
  location?: string
  floor?: number
  surfaceArea?: number
  description?: string
  photoUrl?: string
  isActive: boolean
  equipment?: Equipment[]
}

export interface Notification {
  id: number
  userId: number
  reservationId?: number
  type: 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'MODIFICATION' | 'ADMIN_ALERT'
  message: string
  isRead: boolean
  sentAt: string
}

export interface Feedback {
  id: number
  reservationId: number
  userId: number
  rating: number
  comment?: string
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  createdAt: string
}

export interface DashboardStats {
  totalRooms: number
  totalReservations: number
  activeUsers: number
  todayReservations: number
  occupancyRate: number
  pendingReservations: number
  confirmedReservations: number
  cancelledReservations: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  department?: string
  phone?: string
}

export interface AuthResponse {
  token: string
  id: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  department?: string
}

export interface CreateReservationRequest {
  roomId: number
  title: string
  description?: string
  startTime: string
  endTime: string
  participantsCount: number
  equipmentIds?: number[]
  recurrenceType?: RecurrenceType
  recurrenceEndDate?: string
}
