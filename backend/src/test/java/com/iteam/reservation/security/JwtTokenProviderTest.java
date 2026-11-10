package com.iteam.reservation.security;

import com.iteam.reservation.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private static final String SECRET = "unit-test-secret-key-with-at-least-32-bytes!!";

    private JwtTokenProvider provider;
    private User user;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(provider, "jwtExpiration", 60_000L);
        user = User.builder().email("user@example.com").passwordHash("x").firstName("A").lastName("B").build();
    }

    @Test
    void generatedTokenIsValidAndCarriesTheSubject() {
        String token = provider.generateToken(user);
        assertTrue(provider.validateToken(token));
        assertEquals("user@example.com", provider.getUsernameFromToken(token));
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = provider.generateToken(user);
        assertFalse(provider.validateToken(token + "x"));
        assertFalse(provider.validateToken("not-a-jwt"));
    }

    @Test
    void expiredTokenIsRejected() {
        ReflectionTestUtils.setField(provider, "jwtExpiration", -1_000L);
        assertFalse(provider.validateToken(provider.generateToken(user)));
    }

    @Test
    void tooShortSecretFailsFast() {
        ReflectionTestUtils.setField(provider, "jwtSecret", "short");
        assertThrows(IllegalStateException.class, provider::validateSecret);
    }
}
