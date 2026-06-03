package com.fivemin.repository;

import com.fivemin.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long> {

    // user_id로 복용 중인 약 목록 찾기
    List<Medication> findByUserId(Long userId);

    // user_id로 약 전체 삭제
    void deleteByUserId(Long userId);
}