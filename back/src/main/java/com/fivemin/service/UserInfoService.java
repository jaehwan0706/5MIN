package com.fivemin.service;

import com.fivemin.entity.*;
import com.fivemin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserInfoService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final VehicleRepository vehicleRepository;
    private final MedicationRepository medicationRepository;
    private final EmergencyContactRepository emergencyContactRepository;

    // 사용자 조회 (이메일로)
    public User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
    }

    // 응급 정보 카드 조회
    public PatientProfile getPatientProfile(String email) {
        User user = getUser(email);
        return patientProfileRepository.findByUserId(user.getId())
                .orElse(null);
    }

    // 응급 정보 카드 저장/수정
    @Transactional
    public PatientProfile savePatientProfile(String email, PatientProfile request) {
        User user = getUser(email);

        PatientProfile profile = patientProfileRepository.findByUserId(user.getId())
                .orElse(new PatientProfile());

        profile.setUser(user);
        profile.setBloodTypeEnc(request.getBloodTypeEnc());
        profile.setConditionsEnc(request.getConditionsEnc());
        profile.setAllergiesEnc(request.getAllergiesEnc());
        profile.setGuardianContactEnc(request.getGuardianContactEnc());

        return patientProfileRepository.save(profile);
    }

    // 차량 정보 조회
    public List<Vehicle> getVehicles(String email) {
        User user = getUser(email);
        return vehicleRepository.findByUserId(user.getId());
    }

    // 차량 정보 저장
    @Transactional
    public Vehicle saveVehicle(String email, Vehicle request) {
        User user = getUser(email);
        request.setUser(user);
        return vehicleRepository.save(request);
    }

    // 차량 정보 삭제
    @Transactional
    public void deleteVehicle(Long vehicleId) {
        vehicleRepository.deleteById(vehicleId);
    }

    // 복용 중인 약 조회
    public List<Medication> getMedications(String email) {
        User user = getUser(email);
        return medicationRepository.findByUserId(user.getId());
    }

    // 복용 중인 약 저장
    @Transactional
    public Medication saveMedication(String email, Medication request) {
        User user = getUser(email);
        request.setUser(user);
        return medicationRepository.save(request);
    }

    // 복용 중인 약 삭제
    @Transactional
    public void deleteMedication(Long medicationId) {
        medicationRepository.deleteById(medicationId);
    }

    // 긴급 연락처 조회 (우선순위 순)
    public List<EmergencyContact> getEmergencyContacts(String email) {
        User user = getUser(email);
        return emergencyContactRepository.findByUserIdOrderByPriorityAsc(user.getId());
    }

    // 긴급 연락처 저장
    @Transactional
    public EmergencyContact saveEmergencyContact(String email, EmergencyContact request) {
        User user = getUser(email);
        request.setUser(user);
        return emergencyContactRepository.save(request);
    }

    // 긴급 연락처 삭제
    @Transactional
    public void deleteEmergencyContact(Long contactId) {
        emergencyContactRepository.deleteById(contactId);
    }
}