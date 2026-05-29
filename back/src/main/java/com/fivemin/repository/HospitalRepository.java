package com.fivemin.repository;

import com.fivemin.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

// 병원 정보 DB 저장/조회 담당
@Repository
public interface HospitalRepository extends JpaRepository<Hospital, String> {

    // 사용자 위치(위도/경도) 기준 반경 내 병원 조회 — Haversine 공식, 거리 단위: km
    // LEAST/GREATEST로 acos 인자를 [-1, 1]로 클램핑하여 부동소수점 오차 방지
    @Query(value = """
        SELECT * FROM (
          SELECT *, (6371 * acos(LEAST(1.0, GREATEST(-1.0,
            cos(radians(:lat)) * cos(radians(wgs84_lat)) *
            cos(radians(wgs84_lon) - radians(:lon)) +
            sin(radians(:lat)) * sin(radians(wgs84_lat))
          )))) AS distance
          FROM hospital
          WHERE wgs84_lat IS NOT NULL AND wgs84_lon IS NOT NULL
        ) AS subq
        WHERE distance < :radius
        ORDER BY distance
        LIMIT :limitCount
        """, nativeQuery = true)
    List<Hospital> findNearbyHospitals(
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("radius") double radius,
            @Param("limitCount") int limitCount
    );
}