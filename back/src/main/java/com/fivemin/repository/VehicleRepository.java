package com.fivemin.repository;

import com.fivemin.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    // user_id로 차량 목록 찾기 (내 차량 정보 조회 시 사용)
    List<Vehicle> findByUserId(Long userId);

    // user_id로 차량 삭제
    void deleteByUserId(Long userId);
}