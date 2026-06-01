package com.fivemin.repository;

import com.fivemin.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, Long> {

    // user_id로 긴급 연락처 목록 찾기 (우선순위 순으로 정렬)
    List<EmergencyContact> findByUserIdOrderByPriorityAsc(Long userId);

    // user_id로 긴급 연락처 전체 삭제
    void deleteByUserId(Long userId);
}