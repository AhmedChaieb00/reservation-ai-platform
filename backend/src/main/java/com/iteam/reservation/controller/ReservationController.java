package com.iteam.reservation.controller;

import com.iteam.reservation.dto.CreateReservationRequest;
import com.iteam.reservation.dto.ReservationDTO;
import com.iteam.reservation.entity.Reservation;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<List<ReservationDTO>> getAll(Authentication auth) {
        User user = (User) auth.getPrincipal();
        List<Reservation> reservations;
        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.MANAGER) {
            reservations = reservationService.findAll();
        } else {
            reservations = reservationService.findByUser(user.getId());
        }
        return ResponseEntity.ok(reservations.stream()
            .map(reservationService::toDTO)
            .collect(Collectors.toList()));
    }

    @GetMapping("/today")
    public ResponseEntity<List<ReservationDTO>> getToday() {
        return ResponseEntity.ok(reservationService.findTodayReservations().stream()
            .map(reservationService::toDTO)
            .collect(Collectors.toList()));
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<ReservationDTO>> getCalendar(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
        @RequestParam(required = false) Long roomId,
        Authentication auth
    ) {
        User user = (User) auth.getPrincipal();
        Long userId = (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.MANAGER) ? null : user.getId();
        return ResponseEntity.ok(reservationService.findCalendarEvents(start, end, roomId, userId).stream()
            .map(reservationService::toDTO)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationService.toDTO(reservationService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ReservationDTO> create(@Valid @RequestBody CreateReservationRequest request,
                                                  Authentication auth) {
        User user = (User) auth.getPrincipal();
        Reservation reservation = reservationService.create(request, user.getId());
        return ResponseEntity.status(201).body(reservationService.toDTO(reservation));
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ReservationDTO> confirm(@PathVariable Long id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(reservationService.toDTO(reservationService.confirm(id, user.getId())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> cancel(@PathVariable Long id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        boolean isAdmin = user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.MANAGER;
        reservationService.cancel(id, user.getId(), isAdmin);
        return ResponseEntity.ok(Map.of("message", "Réservation annulée avec succès"));
    }
}
