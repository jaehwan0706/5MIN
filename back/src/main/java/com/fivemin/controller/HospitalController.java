package com.fivemin.controller;

import com.fivemin.entity.Hospital;
import com.fivemin.entity.User;
import com.fivemin.repository.HospitalRepository;
import com.fivemin.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// DB에 저장된 병원 기본정보 조회 담당
@RestController
@RequestMapping("/api/hospital")
public class HospitalController {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    public HospitalController(HospitalRepository hospitalRepository, UserRepository userRepository) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
    }

    // 전체 병원 목록 조회
    // 호출예시: /api/hospital
    @GetMapping
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    // 특정 병원 단건 조회
    // 호출예시: /api/hospital/A1100001
    @GetMapping("/{hpid}")
    public Hospital getHospital(@PathVariable String hpid) {
        return hospitalRepository.findById(hpid).orElse(null);
    }

    // 위치 기반 가까운 병원 조회 (Haversine 공식)
    // 호출예시 (좌표 직접): /api/hospital/nearby?lat=37.527&lon=127.108
    // 호출예시 (사용자 ID): /api/hospital/nearby?userId=1
    // 옵션: radius(km, 기본 5), limit(최대 개수, 기본 20)
    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyHospitals(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lon", required = false) Double lon,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "radius", defaultValue = "5.0") double radius,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {

        if (userId != null) {
            Optional<User> user = userRepository.findById(userId);
            if (user.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "사용자를 찾을 수 없습니다."));
            }
            if (user.get().getLatitude() == null || user.get().getLongitude() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "사용자 위치 정보가 없습니다. 위치를 먼저 업데이트해주세요."));
            }
            lat = user.get().getLatitude();
            lon = user.get().getLongitude();
        }

        if (lat == null || lon == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "위치 정보(lat, lon) 또는 userId를 입력해주세요."));
        }

        List<Hospital> hospitals = hospitalRepository.findNearbyHospitals(lat, lon, radius, limit);
        return ResponseEntity.ok(hospitals);
    }
}