package com.fivemin.service;

import com.fivemin.dto.AuthResponse;
import com.fivemin.dto.LoginRequest;
import com.fivemin.dto.RegisterRequest;
import com.fivemin.entity.Role;
import com.fivemin.entity.User;
import com.fivemin.jwt.JwtUtil;
import com.fivemin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(Role.USER)
            .build();
        userRepository.save(user);

        return AuthResponse.builder()
            .token(jwtUtil.generateToken(user.getEmail()))
            .email(user.getEmail())
            .role(user.getRole().name())
            .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return AuthResponse.builder()
            .token(jwtUtil.generateToken(user.getEmail()))
            .email(user.getEmail())
            .role(user.getRole().name())
            .build();
    }
}
