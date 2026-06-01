package com.fivemin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 사용자 이름
    @Column(name = "name", nullable = false)
    private String name;

    // 로그인 이메일 (unique)
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    // BCrypt 암호화된 비밀번호
    @Column(name = "password", nullable = false)
    private String password;

    // 전화번호
    @Column(name = "phone")
    private String phone;

    // 사용자 현재 위치 위도
    @Column(name = "latitude")
    private Double latitude;

    // 사용자 현재 위치 경도
    @Column(name = "longitude")
    private Double longitude;

    // 권한 (user | admin), 기본값 user
    @Column(name = "role", length = 10)
    private String role = "user";

    // 다크모드 설정, 기본값 false
    @Column(name = "dark_mode")
    private Boolean darkMode = false;

    // 응급실 혼잡 알림 설정, 기본값 true
    @Column(name = "alert_enabled")
    private Boolean alertEnabled = true;

    // 소셜 로그인 제공자 (local | kakao | google), 기본값 local
    @Column(name = "provider", length = 20)
    private String provider = "local";

    // 소셜 로그인 제공자 ID
    @Column(name = "provider_id")
    private String providerId;

    // 혈액형
    @Column(name = "blood_type")
    private String bloodType;

    // 지병
    @Column(name = "chronic_disease", columnDefinition = "TEXT")
    private String chronicDisease;

    // 긴급 연락처
    @Column(name = "emergency_cont", columnDefinition = "TEXT")
    private String emergencyCont;

    // 정보 입력 완료 여부, 기본값 false
    @Column(name = "info_completed")
    private Boolean infoCompleted = false;

    // 차량 정보
    @Column(name = "car_info")
    private String carInfo;

    // 복용 중인 약
    @Column(name = "medications")
    private String medications;

    // 계정 생성일
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 계정 수정일
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 저장 전 자동으로 생성일 세팅
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 수정 전 자동으로 수정일 업데이트
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}