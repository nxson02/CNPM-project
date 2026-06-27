package com.example.demo.controller;

import com.example.demo.entity.Bill;
import com.example.demo.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private BillService billService;

    @GetMapping("/bills/{id}")
    public ResponseEntity<?> getPaymentInfo(@PathVariable Long id) {
        try {
            Bill bill = billService.getOrCreatePaymentInfo(id);
            return ResponseEntity.ok(toPaymentResponse(bill));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> payload) {
        try {
            Long billId = parseBillId(payload.get("billId"));
            String transactionId = payload.get("transactionId") == null
                    ? null
                    : payload.get("transactionId").toString();

            Bill bill = billService.processResidentPayment(billId, transactionId);
            return ResponseEntity.ok(toPaymentResponse(bill));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private Long parseBillId(Object value) {
        if (value == null) {
            throw new RuntimeException("Thiếu mã hóa đơn");
        }

        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Mã hóa đơn không hợp lệ");
        }
    }

    private Map<String, Object> toPaymentResponse(Bill bill) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", bill.getId());
        response.put("apartmentNumber", bill.getApartmentNumber());
        response.put("billType", bill.getBillType());
        response.put("amount", bill.getAmount());
        response.put("dueDate", bill.getDueDate());
        response.put("description", bill.getDescription());
        response.put("status", bill.getStatus());
        response.put("qrCodeUrl", bill.getQrCodeUrl());
        response.put("paymentReferenceCode", bill.getPaymentReferenceCode());
        response.put("transactionId", bill.getTransactionId());
        response.put("lastCheckTime", bill.getLastCheckTime());
        response.put("paymentError", bill.getPaymentError());
        return response;
    }
}
