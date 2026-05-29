package com.fivemin.repository;

import com.fivemin.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// 병원 정보 DB 저장/조회 담당
@Repository
public interface HospitalRepository extends JpaRepository<Hospital, String> {

}