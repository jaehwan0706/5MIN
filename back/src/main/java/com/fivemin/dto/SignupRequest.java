package com.fivemin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SignupRequest {

    // 이름 (필수)
    @NotBlank(message = "이름은 필수입니다")
    private String name;

    // 이메일 (필수, 형식 체크)
    @Email(message = "이메일 형식이 올바르지 않습니다")
    @NotBlank(message = "이메일은 필수입니다")
    private String email;

    // 비밀번호 (필수, 8자 이상)
    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다")
    private String password;

    // 전화번호 (선택)
    private String phone;
}