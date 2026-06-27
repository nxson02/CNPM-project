package com.example.demo.controller;

import com.example.demo.dto.NotificationResponseDTO;
import com.example.demo.entity.Notification;
import com.example.demo.entity.Resident;
import com.example.demo.entity.User;
import com.example.demo.service.NotificationService;
import com.example.demo.service.ResidentService;
import com.example.demo.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class UserNotificationController {

    private final NotificationService notificationService;
    private final UserService userService;
    private final ResidentService residentService;

    public UserNotificationController(
            NotificationService notificationService,
            UserService userService,
            ResidentService residentService) {
        this.notificationService = notificationService;
        this.userService = userService;
        this.residentService = residentService;
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> getNotifications(Principal principal) {
        Resident resident = getCurrentResident(principal);
        if (resident == null) {
            return ResponseEntity.ok(emptyResponse());
        }
        List<Notification> notifications = notificationService.getResidentNotifications(resident);
        List<NotificationResponseDTO> unread = notifications.stream()
                .filter(notification -> !notification.isRead())
                .map(NotificationResponseDTO::from)
                .toList();
        List<NotificationResponseDTO> read = notifications.stream()
                .filter(Notification::isRead)
                .map(NotificationResponseDTO::from)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("unreadNotifications", unread);
        response.put("readNotifications", read);
        response.put("unreadCount", unread.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mark-as-read")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        Resident resident = getCurrentResident(principal);
        if (resident != null) {
            notificationService.markAllAsRead(resident);
        }
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/mark-as-read/{id}")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Principal principal) {
        notificationService.markAsRead(id, getCurrentResident(principal));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal principal) {
        notificationService.deleteNotification(id, getCurrentResident(principal));
        return ResponseEntity.noContent().build();
    }

    private Resident getCurrentResident(Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("User is not authenticated");
        }
        User user = userService.findByName(principal.getName());
        if (user == null || user.getResidentId() == null) {
            return null;
        }
        return residentService.findById(user.getResidentId());
    }

    private Map<String, Object> emptyResponse() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("unreadNotifications", List.of());
        response.put("readNotifications", List.of());
        response.put("unreadCount", 0);
        return response;
    }
}
