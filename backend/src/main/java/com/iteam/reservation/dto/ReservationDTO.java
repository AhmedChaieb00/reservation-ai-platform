package com.iteam.reservation.dto;

import com.iteam.reservation.entity.Equipment;
import com.iteam.reservation.entity.Reservation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReservationDTO(
    Long id,
    Long userId,
    String userName,
    String userEmail,
    Long roomId,
    String roomName,
    String roomLocation,
    String title,
    String description,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer participantsCount,
    Reservation.ReservationStatus status,
    Reservation.RecurrenceType recurrenceType,
    LocalDate recurrenceEndDate,
    Long parentReservationId,
    List<EquipmentDTO> equipmentList,
    LocalDateTime createdAt
) {
    public record EquipmentDTO(Long id, String name, Equipment.EquipmentType type, String serialNumber) {}
}
