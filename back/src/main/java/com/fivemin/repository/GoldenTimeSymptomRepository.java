package com.fivemin.repository;

import com.fivemin.entity.GoldenTimeSymptom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GoldenTimeSymptomRepository extends JpaRepository<GoldenTimeSymptom, Long> {

    // 활성화된 증상만 표시 순서대로 가져오기 (골든타임 탭 화면용)
    List<GoldenTimeSymptom> findByIsActiveTrueOrderByDisplayOrderAsc();
}