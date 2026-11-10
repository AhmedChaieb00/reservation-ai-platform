package com.iteam.reservation.repository;

import com.iteam.reservation.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUserId(Long userId);
    List<Feedback> findByReservationId(Long reservationId);
    Optional<Feedback> findByReservationIdAndUserId(Long reservationId, Long userId);

    @Query("SELECT AVG(f.rating) FROM Feedback f JOIN f.reservation r WHERE r.room.id = :roomId")
    Double findAverageRatingByRoomId(@Param("roomId") Long roomId);
}
