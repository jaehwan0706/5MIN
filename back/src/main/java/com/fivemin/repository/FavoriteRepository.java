package com.fivemin.repository;

import com.fivemin.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    // user_id로 즐겨찾기 목록 찾기
    List<Favorite> findByUserId(Long userId);

    // user_id와 hpid로 즐겨찾기 찾기 (중복 체크 시 사용)
    Optional<Favorite> findByUserIdAndHospitalHpid(Long userId, String hpid);

    // user_id와 hpid로 즐겨찾기 존재 여부 확인
    boolean existsByUserIdAndHospitalHpid(Long userId, String hpid);

    // user_id와 hpid로 즐겨찾기 삭제
    void deleteByUserIdAndHospitalHpid(Long userId, String hpid);
}