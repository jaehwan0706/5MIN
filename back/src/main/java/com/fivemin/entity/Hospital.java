package com.fivemin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

// 병원 기본정보 DB 테이블
@Entity
@Table(name = "hospital")
@Getter
@Setter
@NoArgsConstructor
public class Hospital {

    // 병원 고유 ID (기본키)
    @Id
    @Column(name = "hpid", length = 20)
    private String hpid;

    // 병원명
    @Column(name = "duty_name")
    private String dutyName;

    // 전화번호 (📞 전화 버튼용)
    @Column(name = "duty_tel1")
    private String dutyTel1;

    // 주소
    @Column(name = "duty_addr")
    private String dutyAddr;

    // 위도 (지도 핀 마커용)
    @Column(name = "wgs84_lat")
    private Double wgs84Lat;

    // 경도 (지도 핀 마커용)
    @Column(name = "wgs84_lon")
    private Double wgs84Lon;

    // 응급의료기관 종류 코드
    @Column(name = "duty_emcls")
    private String dutyEmcls;

    // 응급의료기관 종류명
    @Column(name = "duty_emcls_name")
    private String dutyEmclsName;

    // 마지막 갱신 시간 (타임스탬프 표시용)
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}