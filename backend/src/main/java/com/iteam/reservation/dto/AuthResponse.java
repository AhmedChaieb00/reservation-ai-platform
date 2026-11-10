package com.iteam.reservation.dto;

import com.iteam.reservation.entity.User;

public record AuthResponse(
    String token,
    Long id,
    String email,
    String firstName,
    String lastName,
    User.Role role,
    String department
) {}
