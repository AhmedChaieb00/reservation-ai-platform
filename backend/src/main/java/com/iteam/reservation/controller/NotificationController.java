package com.iteam.reservation.controller;

import com.iteam.reservation.entity.Notification;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(Authentication auth) {
        User user = (User) auth.getPrincipal();
        List<Notification> notifications = notificationService.getUserNotifications(user.getId());
        long unread = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("notifications", notifications, "unreadCount", unread));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable Long id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Notification marquée comme lue"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(Authentication auth) {
        User user = (User) auth.getPrincipal();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "Toutes les notifications marquées comme lues"));
    }
}
