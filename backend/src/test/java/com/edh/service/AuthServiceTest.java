package com.edh.service;

import com.edh.dto.AuthResponse;
import com.edh.dto.LoginRequest;
import com.edh.dto.RegisterRequest;
import com.edh.exception.UserAlreadyExistsException;
import com.edh.model.User;
import com.edh.repository.UserRepository;
import com.edh.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        lenient().when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("mock-jwt-token-xyz");
    }

    @Test
    void register_NewUser_Success() {
        RegisterRequest request = new RegisterRequest("newuser", "password123", "ADMIN");
        when(userRepository.findAllByUsernameIgnoreCase("newuser")).thenReturn(Collections.emptyList());
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("newuser", response.getUsername());
        assertEquals("mock-jwt-token-xyz", response.getToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_DuplicateUser_ThrowsUserAlreadyExistsException() {
        RegisterRequest request = new RegisterRequest("existinguser", "password123", "ADMIN");
        when(userRepository.findAllByUsernameIgnoreCase("existinguser"))
                .thenReturn(List.of(new User("existinguser", "encoded", "ADMIN")));

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_ValidCredentials_Success() {
        LoginRequest request = new LoginRequest("validuser", "password123");
        User user = new User("validuser", "encodedPassword", "ADMIN");

        when(userRepository.findAllByUsernameIgnoreCase("validuser")).thenReturn(List.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("validuser", response.getUsername());
        assertEquals("mock-jwt-token-xyz", response.getToken());
    }

    @Test
    void login_InvalidPassword_ThrowsBadCredentialsException() {
        LoginRequest request = new LoginRequest("validuser", "wrongpassword");
        User user = new User("validuser", "encodedPassword", "ADMIN");

        when(userRepository.findAllByUsernameIgnoreCase("validuser")).thenReturn(List.of(user));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }
}
