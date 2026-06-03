package com.fivemin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_profiles")
@Getter
@Setter
@NoArgsConstructor
public class PatientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // users 테이블과 1:1 관계
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 혈액형 (AES-256 암호화 저장)
    @Column(name = "blood_type_enc")
    private String bloodTypeEnc;

    // 지병 (AES-256 암호화 저장 | 고혈압, 당뇨 등)
    @Column(name = "conditions_enc")
    private String conditionsEnc;

    // 알레르기 (AES-256 암호화 저장 | 페니실린 등)
    @Column(name = "allergies_enc")
    private String allergiesEnc;

    // 보호자 연락처 (AES-256 암호화 저장)
    @Column(name = "guardian_contact_enc")
    private String guardianContactEnc;

    // 수정일
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 수정 전 자동으로 수정일 업데이트
    @PrePersist
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}