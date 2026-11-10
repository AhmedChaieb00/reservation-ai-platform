package com.iteam.reservation.service;

import com.iteam.reservation.dto.CreateReservationRequest;
import com.iteam.reservation.dto.ReservationDTO;
import com.iteam.reservation.entity.*;
import com.iteam.reservation.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final EquipmentRepository equipmentRepository;
    private final NotificationService notificationService;

    @Transactional
    public Reservation create(CreateReservationRequest req, Long userId) {
        if (!req.endTime().isAfter(req.startTime())) {
            throw new IllegalArgumentException("L'heure de fin doit être après l'heure de début");
        }

        Room room = roomRepository.findById(req.roomId())
            .orElseThrow(() -> new NoSuchElementException("Salle introuvable"));

        if (req.participantsCount() > room.getCapacity()) {
            throw new IllegalArgumentException(
                "Le nombre de participants dépasse la capacité de la salle (" + room.getCapacity() + ")");
        }

        List<Reservation> conflicts = reservationRepository.findConflicts(
            req.roomId(), req.startTime(), req.endTime(), null
        );
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("La salle est déjà réservée pour ce créneau");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable"));

        List<Equipment> equipment = new ArrayList<>();
        if (req.equipmentIds() != null && !req.equipmentIds().isEmpty()) {
            equipment = equipmentRepository.findAllById(req.equipmentIds());
        }

        Reservation reservation = Reservation.builder()
            .user(user)
            .room(room)
            .title(req.title())
            .description(req.description())
            .startTime(req.startTime())
            .endTime(req.endTime())
            .participantsCount(req.participantsCount())
            .status(Reservation.ReservationStatus.PENDING)
            .recurrenceType(req.recurrenceType() != null ? req.recurrenceType() : Reservation.RecurrenceType.NONE)
            .recurrenceEndDate(req.recurrenceEndDate())
            .equipmentList(equipment)
            .build();

        final Reservation saved = reservationRepository.save(reservation);

        notificationService.createNotification(
            userId, saved.getId(),
            Notification.NotificationType.CONFIRMATION,
            "Votre réservation \"" + req.title() + "\" pour la " + room.getName() + " est en attente de confirmation."
        );

        // Notify managers
        userRepository.findByRole(User.Role.MANAGER).forEach(manager ->
            notificationService.createNotification(
                manager.getId(), saved.getId(),
                Notification.NotificationType.ADMIN_ALERT,
                "Nouvelle réservation en attente : \"" + req.title() + "\" — " + user.getFirstName() + " " + user.getLastName()
            )
        );

        log.info("Reservation created: {} by user {}", saved.getId(), userId);
        return saved;
    }

    public Reservation findById(Long id) {
        return reservationRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Réservation introuvable: " + id));
    }

    public List<Reservation> findAll() {
        return reservationRepository.findAll();
    }

    public List<Reservation> findByUser(Long userId) {
        return reservationRepository.findByUserId(userId);
    }

    public List<Reservation> findCalendarEvents(LocalDateTime start, LocalDateTime end, Long roomId, Long userId) {
        return reservationRepository.findCalendarEvents(start, end, roomId, userId);
    }

    public List<Reservation> findTodayReservations() {
        return reservationRepository.findTodayReservations();
    }

    @Transactional
    public Reservation confirm(Long id, Long confirmerId) {
        Reservation reservation = findById(id);
        reservation.setStatus(Reservation.ReservationStatus.CONFIRMED);
        reservation = reservationRepository.save(reservation);

        notificationService.createNotification(
            reservation.getUser().getId(), id,
            Notification.NotificationType.CONFIRMATION,
            "Votre réservation \"" + reservation.getTitle() + "\" a été confirmée."
        );
        return reservation;
    }

    @Transactional
    public Reservation cancel(Long id, Long userId, boolean isAdmin) {
        Reservation reservation = findById(id);
        if (!isAdmin && !reservation.getUser().getId().equals(userId)) {
            throw new SecurityException("Vous ne pouvez annuler que vos propres réservations");
        }
        reservation.setStatus(Reservation.ReservationStatus.CANCELLED);
        reservation = reservationRepository.save(reservation);

        notificationService.createNotification(
            reservation.getUser().getId(), id,
            Notification.NotificationType.CANCELLATION,
            "Votre réservation \"" + reservation.getTitle() + "\" a été annulée."
        );
        return reservation;
    }

    public ReservationDTO toDTO(Reservation r) {
        List<ReservationDTO.EquipmentDTO> eqDTOs = r.getEquipmentList() == null ? List.of() :
            r.getEquipmentList().stream()
                .map(e -> new ReservationDTO.EquipmentDTO(e.getId(), e.getName(), e.getType(), e.getSerialNumber()))
                .collect(Collectors.toList());

        return new ReservationDTO(
            r.getId(),
            r.getUser().getId(),
            r.getUser().getFirstName() + " " + r.getUser().getLastName(),
            r.getUser().getEmail(),
            r.getRoom().getId(),
            r.getRoom().getName(),
            r.getRoom().getLocation(),
            r.getTitle(),
            r.getDescription(),
            r.getStartTime(),
            r.getEndTime(),
            r.getParticipantsCount(),
            r.getStatus(),
            r.getRecurrenceType(),
            r.getRecurrenceEndDate(),
            r.getParentReservationId(),
            eqDTOs,
            r.getCreatedAt()
        );
    }

    public long countByStatus(Reservation.ReservationStatus status) {
        return reservationRepository.countByStatus(status);
    }

    public long countToday() {
        return reservationRepository.countTodayReservations();
    }
}
