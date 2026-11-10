package com.iteam.reservation.dto;

public record DashboardStatsDTO(
    long totalRooms,
    long totalReservations,
    long activeUsers,
    long todayReservations,
    double occupancyRate,
    long pendingReservations,
    long confirmedReservations,
    long cancelledReservations
) {}
