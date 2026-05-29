package com.fivemin.controller;

import com.fivemin.entity.Hospital;
import com.fivemin.repository.HospitalRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// DB에 저장된 병원 기본정보 조회 담당
@RestController
@RequestMapping("/api/hospital")
public class HospitalController {

    private final HospitalRepository hospitalRepository;

    public HospitalController(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
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
}