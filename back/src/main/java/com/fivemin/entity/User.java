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

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password") // 소셜 로그인의 경우 비밀번호가 없을 수 있으므로 nullable=true (기본값)
    private String password;

    @Column(name = "phone")
    private String phone;

    // 로그인 제공자 (LOCAL, KAKAO, GOOGLE)
    @Column(name = "provider", nullable = false)
    private String provider = "LOCAL";

    // 소셜 로그인 고유 ID
    @Column(name = "provider_id")
    private String providerId;

    // 사용자 현재 위치 위도
    @Column(name = "latitude")
    private Double latitude;

    // 사용자 현재 위치 경도
    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
