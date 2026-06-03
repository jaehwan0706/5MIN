package com.fivemin.controller;

import com.fivemin.entity.GoldenTimeSymptom;
import com.fivemin.service.GoldenTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/symptoms")
@RequiredArgsConstructor
public class GoldenTimeController {

    private final GoldenTimeService goldenTimeService;

    // 증상 목록 조회 (골든타임 탭 화면용)
    // GET /api/symptoms
    @GetMapping
    public ResponseEntity<List<GoldenTimeSymptom>> getSymptoms() {
        return ResponseEntity.ok(goldenTimeService.getSymptoms());
    }

    // 증상 단건 조회 (Claude API 연동 시 프롬프트 가져올 때 사용)
    // GET /api/symptoms/{id}
    @GetMapping("/{id}")
    public ResponseEntity<GoldenTimeSymptom> getSymptom(@PathVariable Long id) {
        return ResponseEntity.ok(goldenTimeService.getSymptom(id));
    }
}