package com.fivemin.controller;

import com.fivemin.entity.*;
import com.fivemin.service.UserInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserInfoController {

    private final UserInfoService userInfoService;

    // 응급 정보 카드 조회
    // GET /api/user/profile
    @GetMapping("/profile")
    public ResponseEntity<PatientProfile> getProfile(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(userInfoService.getPatientProfile(email));
    }

    // 응급 정보 카드 저장/수정
    // POST /api/user/profile
    @PostMapping("/profile")
    public ResponseEntity<PatientProfile> saveProfile(
            @AuthenticationPrincipal String email,
            @RequestBody PatientProfile request) {
        return ResponseEntity.ok(userInfoService.savePatientProfile(email, request));
    }

    // 차량 정보 조회
    // GET /api/user/vehicles
    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getVehicles(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(userInfoService.getVehicles(email));
    }

    // 차량 정보 저장
    // POST /api/user/vehicles
    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> saveVehicle(
            @AuthenticationPrincipal String email,
            @RequestBody Vehicle request) {
        return ResponseEntity.ok(userInfoService.saveVehicle(email, request));
    }

    // 차량 정보 삭제
    // DELETE /api/user/vehicles/{vehicleId}
    @DeleteMapping("/vehicles/{vehicleId}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long vehicleId) {
        userInfoService.deleteVehicle(vehicleId);
        return ResponseEntity.noContent().build();
    }

    // 복용 중인 약 조회
    // GET /api/user/medications
    @GetMapping("/medications")
    public ResponseEntity<List<Medication>> getMedications(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(userInfoService.getMedications(email));
    }

    // 복용 중인 약 저장
    // POST /api/user/medications
    @PostMapping("/medications")
    public ResponseEntity<Medication> saveMedication(
            @AuthenticationPrincipal String email,
            @RequestBody Medication request) {
        return ResponseEntity.ok(userInfoService.saveMedication(email, request));
    }

    // 복용 중인 약 삭제
    // DELETE /api/user/medications/{medicationId}
    @DeleteMapping("/medications/{medicationId}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long medicationId) {
        userInfoService.deleteMedication(medicationId);
        return ResponseEntity.noContent().build();
    }

    // 긴급 연락처 조회
    // GET /api/user/contacts
    @GetMapping("/contacts")
    public ResponseEntity<List<EmergencyContact>> getContacts(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(userInfoService.getEmergencyContacts(email));
    }

    // 긴급 연락처 저장
    // POST /api/user/contacts
    @PostMapping("/contacts")
    public ResponseEntity<EmergencyContact> saveContact(
            @AuthenticationPrincipal String email,
            @RequestBody EmergencyContact request) {
        return ResponseEntity.ok(userInfoService.saveEmergencyContact(email, request));
    }

    // 긴급 연락처 삭제
    // DELETE /api/user/contacts/{contactId}
    @DeleteMapping("/contacts/{contactId}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long contactId) {
        userInfoService.deleteEmergencyContact(contactId);
        return ResponseEntity.noContent().build();
    }
}