package com.iteam.reservation.repository;

import com.iteam.reservation.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByRoomId(Long roomId);
    List<Reservation> findByStatus(Reservation.ReservationStatus status);

    @Query("""
        SELECT r FROM Reservation r WHERE r.room.id = :roomId
        AND r.status IN ('PENDING', 'CONFIRMED')
        AND r.startTime < :endTime AND r.endTime > :startTime
        AND (:excludeId IS NULL OR r.id != :excludeId)
    """)
    List<Reservation> findConflicts(
        @Param("roomId") Long roomId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("excludeId") Long excludeId
    );

    @Query("""
        SELECT r FROM Reservation r
        WHERE r.startTime >= :start AND r.startTime < :end
        AND (:roomId IS NULL OR r.room.id = :roomId)
        AND (:userId IS NULL OR r.user.id = :userId)
        ORDER BY r.startTime ASC
    """)
    List<Reservation> findCalendarEvents(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("roomId") Long roomId,
        @Param("userId") Long userId
    );

    @Query("""
        SELECT r FROM Reservation r
        WHERE DATE(r.startTime) = CURRENT_DATE
        AND r.status IN ('PENDING', 'CONFIRMED')
        ORDER BY r.startTime ASC
    """)
    List<Reservation> findTodayReservations();

    @Query("""
        SELECT r FROM Reservation r
        WHERE r.startTime BETWEEN :start AND :end
        AND r.status IN ('PENDING', 'CONFIRMED')
        ORDER BY r.startTime ASC
    """)
    List<Reservation> findUpcoming(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    long countByStatus(Reservation.ReservationStatus status);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE DATE(r.startTime) = CURRENT_DATE AND r.status IN ('PENDING','CONFIRMED')")
    long countTodayReservations();
}
