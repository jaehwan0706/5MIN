package com.fivemin.service;

import com.fivemin.entity.User;
import com.fivemin.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    @Transactional
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
                .filter(u -> "LOCAL".equals(u.getProvider())) // 일반 로그인은 LOCAL 계정만 가능
                .filter(u -> u.getPassword() != null && passwordEncoder.matches(password, u.getPassword()));
    }

    // 소셜 로그인 처리 (회원이 없으면 자동 가입)
    @Transactional
    public User processSocialLogin(String provider, String providerId, String email, String name) {
        // 1. 소셜 고유 ID로 먼저 확인
        Optional<User> socialUser = userRepository.findByProviderAndProviderId(provider, providerId);
        if (socialUser.isPresent()) {
            return socialUser.get();
        }

        // 2. 이메일로 기존 사용자 확인
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // 기존 계정에 소셜 정보 업데이트 (연동)
            user.setProvider(provider);
            user.setProviderId(providerId);
            return userRepository.save(user);
        }

        // 3. 신규 소셜 사용자 생성
        User newUser = new User();
        newUser.setName(name != null && !name.isBlank() ? name : "소셜 사용자");
        newUser.setEmail(email);
        newUser.setProvider(provider);
        newUser.setProviderId(providerId);
        newUser.setCreatedAt(LocalDateTime.now());
        
        // DB의 NOT NULL 제약조건을 피하기 위해 임시 비밀번호 생성 (사용되지는 않음)
        String dummyPassword = java.util.UUID.randomUUID().toString();
        newUser.setPassword(passwordEncoder.encode(dummyPassword));
        
        return userRepository.save(newUser);
    }

    // 사용자 위치 갱신 (앱 실행 시 GPS 좌표 업데이트용)
    @Transactional
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
