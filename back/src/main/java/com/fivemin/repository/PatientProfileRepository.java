package com.fivemin.repository;

import com.fivemin.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {

    // user_id로 환자 프로필 찾기 (내 정보 조회 시 사용)
    Optional<PatientProfile> findByUserId(Long userId);

    // user_id로 환자 프로필 존재 여부 확인
    boolean existsByUserId(Long userId);
}