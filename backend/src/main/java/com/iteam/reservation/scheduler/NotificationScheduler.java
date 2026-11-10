package com.iteam.reservation.scheduler;

import com.iteam.reservation.entity.Notification;
import com.iteam.reservation.entity.Reservation;
import com.iteam.reservation.repository.ReservationRepository;
import com.iteam.reservation.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 300000) // every 5 minutes
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in30Min = now.plusMinutes(30);
        LocalDateTime in31Min = now.plusMinutes(31);

        List<Reservation> upcoming = reservationRepository.findUpcoming(in30Min, in31Min);
        for (Reservation reservation : upcoming) {
            notificationService.createNotification(
                reservation.getUser().getId(),
                reservation.getId(),
                Notification.NotificationType.REMINDER,
                "Rappel : votre réservation \"" + reservation.getTitle() + "\" commence dans 30 minutes à " +
                reservation.getRoom().getName() + "."
            );
        }

        if (!upcoming.isEmpty()) {
            log.info("Sent {} reminder notifications", upcoming.size());
        }
    }

    @Scheduled(cron = "0 0 1 * * *") // daily at 1am
    public void markCompletedReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> confirmed = reservationRepository.findByStatus(Reservation.ReservationStatus.CONFIRMED);
        long count = 0;
        for (Reservation r : confirmed) {
            if (r.getEndTime().isBefore(now)) {
                r.setStatus(Reservation.ReservationStatus.COMPLETED);
                reservationRepository.save(r);
                count++;
            }
        }
        if (count > 0) {
            log.info("Marked {} reservations as COMPLETED", count);
        }
    }
}
