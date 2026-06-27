package com.example.demo.dto;

import com.example.demo.entity.Notification;

import java.time.LocalDateTime;

public record NotificationResponseDTO(
        Long id,
        String message,
        String linkHeader,
        String linkAPI,
        boolean read,
        LocalDateTime createdAt) {

    public static NotificationResponseDTO from(Notification notification) {
        return new NotificationResponseDTO(
                notification.getId(),
                notification.getMessage(),
                notification.getLinkHeader(),
                notification.getLinkAPI(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}
