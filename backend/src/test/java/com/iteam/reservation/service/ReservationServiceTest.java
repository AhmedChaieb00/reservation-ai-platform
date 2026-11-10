package com.iteam.reservation.service;

import com.iteam.reservation.dto.CreateReservationRequest;
import com.iteam.reservation.entity.Reservation;
import com.iteam.reservation.entity.Room;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock ReservationRepository reservationRepository;
    @Mock RoomRepository roomRepository;
    @Mock UserRepository userRepository;
    @Mock EquipmentRepository equipmentRepository;
    @Mock NotificationService notificationService;
    @InjectMocks ReservationService service;

    private final LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);

    private CreateReservationRequest request(LocalDateTime from, LocalDateTime to, int participants) {
        return new CreateReservationRequest(1L, "Sprint review", null, from, to, participants, null, null, null);
    }

    private Room room(int capacity) {
        return Room.builder().id(1L).name("Salle Test").capacity(capacity).build();
    }

    @BeforeEach
    void noop() { /* mocks are reset per test by MockitoExtension */ }

    @Test
    void rejectsEndTimeBeforeStartTime() {
        var req = request(start, start.minusHours(1), 5);
        assertThrows(IllegalArgumentException.class, () -> service.create(req, 1L));
        verifyNoInteractions(reservationRepository);
    }

    @Test
    void rejectsMoreParticipantsThanRoomCapacity() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room(10)));
        var req = request(start, start.plusHours(1), 11);
        assertThrows(IllegalArgumentException.class, () -> service.create(req, 1L));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void rejectsOverlappingReservation() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room(10)));
        when(reservationRepository.findConflicts(eq(1L), any(), any(), isNull()))
            .thenReturn(List.of(new Reservation()));
        var req = request(start, start.plusHours(1), 5);
        assertThrows(IllegalStateException.class, () -> service.create(req, 1L));
        verify(reservationRepository, never()).save(any());
    }

    @Test
    void createsPendingReservationWhenSlotIsFree() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room(10)));
        when(reservationRepository.findConflicts(eq(1L), any(), any(), isNull())).thenReturn(List.of());
        when(userRepository.findById(1L)).thenReturn(Optional.of(
            User.builder().id(1L).email("u@example.com").passwordHash("x").firstName("A").lastName("B").build()));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        Reservation saved = service.create(request(start, start.plusHours(1), 5), 1L);

        assertEquals(Reservation.ReservationStatus.PENDING, saved.getStatus());
        assertEquals("Sprint review", saved.getTitle());
    }
}
