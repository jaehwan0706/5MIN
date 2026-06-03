package com.fivemin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class LoginRequest {

    // 이메일 (필수, 형식 체크)
    @Email(message = "이메일 형식이 올바르지 않습니다")
    @NotBlank(message = "이메일은 필수입니다")
    private String email;

    // 비밀번호 (필수)
    @NotBlank(message = "비밀번호는 필수입니다")
    private String password;
}