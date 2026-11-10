package com.iteam.reservation.service;

import com.iteam.reservation.entity.Notification;
import com.iteam.reservation.entity.Reservation;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.repository.NotificationRepository;
import com.iteam.reservation.repository.ReservationRepository;
import com.iteam.reservation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    @Transactional
    public Notification createNotification(Long userId, Long reservationId,
                                           Notification.NotificationType type, String message) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        Reservation reservation = null;
        if (reservationId != null) {
            reservation = reservationRepository.findById(reservationId).orElse(null);
        }

        Notification notification = Notification.builder()
            .user(user)
            .reservation(reservation)
            .type(type)
            .message(message)
            .isRead(false)
            .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderBySentAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new NoSuchElementException("Notification introuvable"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Accès non autorisé");
        }
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}
