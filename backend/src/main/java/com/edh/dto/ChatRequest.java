package com.edh.dto;

public class ChatRequest {
    private String message;
    private String geminiKey;

    public ChatRequest() {}

    public ChatRequest(String message, String geminiKey) {
        this.message = message;
        this.geminiKey = geminiKey;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getGeminiKey() {
        return geminiKey;
    }

    public void setGeminiKey(String geminiKey) {
        this.geminiKey = geminiKey;
    }
}

