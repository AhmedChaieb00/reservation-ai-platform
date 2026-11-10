package com.iteam.reservation.dto;

import com.iteam.reservation.entity.Reservation;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CreateReservationRequest(
    @NotNull Long roomId,
    @NotBlank String title,
    String description,
    @NotNull @Future LocalDateTime startTime,
    @NotNull LocalDateTime endTime,
    @NotNull @Min(1) Integer participantsCount,
    List<Long> equipmentIds,
    Reservation.RecurrenceType recurrenceType,
    LocalDate recurrenceEndDate
) {}
