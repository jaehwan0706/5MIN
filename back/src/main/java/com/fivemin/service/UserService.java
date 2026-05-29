package com.fivemin.service;

import com.fivemin.entity.User;
import com.fivemin.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 회원가입 — 위치 정보(위도/경도) 함께 저장, 비밀번호 BCrypt 해싱
    public User signup(String name, String email, String password, String phone,
                       Double latitude, Double longitude) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone);
        user.setLatitude(latitude);
        user.setLongitude(longitude);
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    // 로그인 — BCrypt 해시 검증
    public Optional<User> login(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()));
    }

    // 사용자 위치 갱신 (앱 실행 시 GPS 좌표 업데이트용)
    public User updateLocation(Long userId, Double latitude, Double longitude) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setLatitude(latitude);
        user.setLongitude(longitude);
        return userRepository.save(user);
    }

    // 사용자 프로필 조회
    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
