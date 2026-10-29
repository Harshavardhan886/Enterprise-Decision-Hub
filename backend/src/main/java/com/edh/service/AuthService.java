package com.edh.service;

import com.edh.dto.AuthResponse;
import com.edh.dto.LoginRequest;
import com.edh.dto.RegisterRequest;
import com.edh.model.User;
import com.edh.repository.UserRepository;
import com.edh.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${security.admin.invite-key:EDH-ADMIN-2026-KEY}")
    private String expectedAdminInviteKey;

    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";
        String requestedRole = request.getRole() != null ? request.getRole().trim().toUpperCase() : "VIEWER";

        if (username.isBlank() || password.isBlank()) {
            throw new com.edh.exception.BadRequestException("Username and password cannot be empty");
        }

        List<User> existingUsers = userRepository.findAllByUsernameIgnoreCase(username);
        if (!existingUsers.isEmpty()) {
            throw new com.edh.exception.UserAlreadyExistsException("Username '" + username + "' is already registered");
        }

        String assignedRole = "VIEWER";
        if ("ADMIN".equals(requestedRole)) {
            // Allow ADMIN if inviteKey matches OR if database is completely empty (seed admin setup)
            boolean isInviteValid = request.getInviteKey() != null &&
                    request.getInviteKey().trim().equals(expectedAdminInviteKey.trim());
            boolean isInitialAdmin = userRepository.count() == 0;

            if (isInviteValid || isInitialAdmin) {
                assignedRole = "ADMIN";
            } else {
                throw new com.edh.exception.BadRequestException(
                    "Admin registration requires a valid Admin Invite Key. Self-registration defaults to Viewer."
                );
            }
        }

        User user = new User(username, passwordEncoder.encode(password), assignedRole);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, user.getUsername(), user.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String password = request.getPassword() != null ? request.getPassword().trim() : "";

        if (username.isBlank() || password.isBlank()) {
            throw new com.edh.exception.BadRequestException("Username and password cannot be empty");
        }

        List<User> users = userRepository.findAllByUsernameIgnoreCase(username);
        if (users.isEmpty()) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid username or password");
        }

        User user = users.get(0);

        if (!passwordEncoder.matches(password, user.getPassword())) {
            // Fallback: plain text check for legacy passwords
            if (password.equals(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
            } else {
                throw new org.springframework.security.authentication.BadCredentialsException("Invalid username or password");
            }
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, user.getUsername(), user.getRole());
    }

    public AuthResponse refresh(String token) {
        if (token == null || token.isBlank()) {
            throw new com.edh.exception.BadRequestException("Token cannot be empty for refresh");
        }
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;

        if (!jwtUtil.isTokenValid(cleanToken)) {
            throw new com.edh.exception.BadRequestException("Token is invalid or expired. Please sign in again.");
        }

        String username = jwtUtil.extractUsername(cleanToken);
        String role = jwtUtil.extractRole(cleanToken);

        String newToken = jwtUtil.generateToken(username, role);
        return new AuthResponse(newToken, username, role);
    }

    public AuthResponse guestLogin() {
        String username = "guest_viewer";
        String role = "VIEWER";
        String token = jwtUtil.generateToken(username, role);
        return new AuthResponse(token, username, role);
    }
}
