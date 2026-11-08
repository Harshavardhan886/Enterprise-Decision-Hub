package com.edh.controller;

import com.edh.dto.ChatRequest;
import com.edh.dto.ChatResponse;
import com.edh.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody(required = false) ChatRequest request) {
        if (request == null) {
            request = new ChatRequest();
        }
        ChatResponse response = chatService.processChat(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        boolean configured = chatService.isGeminiConfigured();
        return ResponseEntity.ok(Map.of(
                "geminiConfigured", configured,
                "defaultProvider", configured ? "gemini-1.5-flash" : "enterprise-engine",
                "status", "ONLINE"
        ));
    }
}

