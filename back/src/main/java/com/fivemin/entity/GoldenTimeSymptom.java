package com.fivemin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "golden_time_symptoms")
@Getter
@Setter
@NoArgsConstructor
public class GoldenTimeSymptom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 증상 이름 (가슴통증, 뇌졸중 의심 등)
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    // 화면에 표시될 이모지
    @Column(name = "emoji", length = 10)
    private String emoji;

    // 증상 심각도 (critical | urgent | moderate)
    @Column(name = "severity", length = 10)
    private String severity = "critical";

    // Claude API에 넘길 증상별 프롬프트
    @Column(name = "claude_prompt", columnDefinition = "TEXT")
    private String claudePrompt;

    // 화면 표시 순서
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    // 활성화 여부 (false면 화면에 표시 안됨)
    @Column(name = "is_active")
    private Boolean isActive = true;

    // 생성일
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 저장 전 자동으로 생성일 세팅
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}