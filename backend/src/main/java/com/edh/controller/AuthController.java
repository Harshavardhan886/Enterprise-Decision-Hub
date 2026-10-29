package com.edh.controller;

import com.edh.dto.AuthResponse;
import com.edh.dto.LoginRequest;
import com.edh.dto.RegisterRequest;
import com.edh.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.edh.exception.BadRequestException("Bearer token required in Authorization header");
        }
        String token = authHeader.substring(7);
        return ResponseEntity.ok(authService.refresh(token));
    }

    @RequestMapping(value = "/guest", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<AuthResponse> guest() {
        return ResponseEntity.ok(authService.guestLogin());
    }
}
