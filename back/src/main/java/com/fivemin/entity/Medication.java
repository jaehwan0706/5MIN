package com.fivemin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "medications")
@Getter
@Setter
@NoArgsConstructor
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // users 테이블과 다대1 관계 (한 유저가 여러 약 등록 가능)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 약 이름 (AES-256 암호화 저장 | 아스피린, 와파린 등)
    @Column(name = "name_enc", nullable = false)
    private String nameEnc;

    // 생성일
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 저장 전 자동으로 생성일 세팅
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}