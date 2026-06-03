package com.fivemin.service;

import com.fivemin.entity.GoldenTimeSymptom;
import com.fivemin.repository.GoldenTimeSymptomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoldenTimeService {

    private final GoldenTimeSymptomRepository goldenTimeSymptomRepository;

    // 활성화된 증상 목록 조회 (골든타임 탭 화면용)
    public List<GoldenTimeSymptom> getSymptoms() {
        return goldenTimeSymptomRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    // 증상 단건 조회 (Claude API 프롬프트 가져올 때 사용)
    public GoldenTimeSymptom getSymptom(Long id) {
        return goldenTimeSymptomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("증상을 찾을 수 없습니다"));
    }
}