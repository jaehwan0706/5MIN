package com.fivemin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // users 테이블과 다대1 관계 (한 유저가 여러 차량 등록 가능)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 차량번호 (AES-256 암호화 저장)
    @Column(name = "plate_number_enc")
    private String plateNumberEnc;

    // 보험사 (AES-256 암호화 저장)
    @Column(name = "insurance_enc")
    private String insuranceEnc;

    // 생성일
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 저장 전 자동으로 생성일 세팅
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}