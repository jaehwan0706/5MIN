package com.fivemin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    // 액세스 토큰 (API 요청 시 사용)
    private String accessToken;

    // 리프레시 토큰 (액세스 토큰 만료 시 재발급용)
    private String refreshToken;

    // 사용자 이메일
    private String email;

    // 사용자 이름
    private String name;

    // 사용자 권한 (user | admin)
    private String role;
}