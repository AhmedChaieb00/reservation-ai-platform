package com.iteam.reservation.service;

import com.iteam.reservation.dto.AuthResponse;
import com.iteam.reservation.dto.RegisterRequest;
import com.iteam.reservation.entity.Notification;
import com.iteam.reservation.entity.User;
import com.iteam.reservation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalStateException("Un compte existe déjà avec cet email");
        }
        User user = User.builder()
            .email(request.email())
            .passwordHash(passwordEncoder.encode(request.password()))
            .firstName(request.firstName())
            .lastName(request.lastName())
            .department(request.department())
            .phone(request.phone())
            .role(User.Role.USER)
            .isActive(true)
            .build();
        user = userRepository.save(user);
        notificationService.createNotification(
            user.getId(), null, Notification.NotificationType.CONFIRMATION,
            "Bienvenue " + user.getFirstName() + " ! Votre compte ITEAM Réservation a été créé avec succès."
        );
        log.info("New user registered: {}", user.getEmail());
        return user;
    }

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable: " + id));
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Transactional
    public User updateUser(Long id, User updates) {
        User user = findById(id);
        if (updates.getFirstName() != null) user.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) user.setLastName(updates.getLastName());
        if (updates.getDepartment() != null) user.setDepartment(updates.getDepartment());
        if (updates.getPhone() != null) user.setPhone(updates.getPhone());
        if (updates.getRole() != null) user.setRole(updates.getRole());
        if (updates.getIsActive() != null) user.setIsActive(updates.getIsActive());
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findById(id);
        user.setIsActive(false);
        userRepository.save(user);
    }

    public AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(token, user.getId(), user.getEmail(),
            user.getFirstName(), user.getLastName(), user.getRole(), user.getDepartment());
    }
}
