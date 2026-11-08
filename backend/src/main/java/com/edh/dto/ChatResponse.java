package com.edh.dto;

import java.util.Map;

public class ChatResponse {
    private String reply;
    private String provider;
    private boolean geminiActive;
    private String timestamp;
    private Map<String, Object> enterpriseSnapshot;

    public ChatResponse() {}

    public ChatResponse(String reply, String provider, boolean geminiActive, String timestamp, Map<String, Object> enterpriseSnapshot) {
        this.reply = reply;
        this.provider = provider;
        this.geminiActive = geminiActive;
        this.timestamp = timestamp;
        this.enterpriseSnapshot = enterpriseSnapshot;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public boolean isGeminiActive() {
        return geminiActive;
    }

    public void setGeminiActive(boolean geminiActive) {
        this.geminiActive = geminiActive;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getEnterpriseSnapshot() {
        return enterpriseSnapshot;
    }

    public void setEnterpriseSnapshot(Map<String, Object> enterpriseSnapshot) {
        this.enterpriseSnapshot = enterpriseSnapshot;
    }
}

