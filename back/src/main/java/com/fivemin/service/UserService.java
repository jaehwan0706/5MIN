package com.fivemin.service;

import com.fivemin.entity.User;
import com.fivemin.repository.UserRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final RestTemplate restTemplate;
    private final JavaMailSender mailSender;

    // 이메일 → {code, 만료시각} 임시 저장 (인증코드 5분 유효)
    private final ConcurrentHashMap<String, CodeRecord> verifyCodeStore = new ConcurrentHashMap<>();
    private record CodeRecord(String code, LocalDateTime expiresAt) {}

    @Value("${kakao.rest.key}")
    private String kakaoRestKey;

    @Value("${kakao.rest.secret}")
    private String kakaoRestSecret;

    @Value("${google.client.id}")
    private String googleClientId;

    @Value("${google.client.secret}")
    private String googleClientSecret;

    @Value("${spring.mail.username}")
    private String mailFrom;

    public UserService(UserRepository userRepository, RestTemplate restTemplate, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
        this.mailSender = mailSender;
    }

    // 카카오 인가 코드로 토큰 발급 및 사용자 정보 조회 후 로그인 처리
    @Transactional
    public User loginWithKakao(String code, String redirectUri) {
        try {
            // 1. 토큰 발급 요청
            String tokenUrl = "https://kauth.kakao.com/oauth/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", kakaoRestKey);
            params.add("client_secret", kakaoRestSecret); // Client Secret 추가
            params.add("redirect_uri", redirectUri);
            params.add("code", code);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);

            JSONObject tokenJson = new JSONObject(response.getBody());
            String accessToken = tokenJson.getString("access_token");

            // 2. 사용자 정보 조회
            String userUrl = "https://kapi.kakao.com/v2/user/me";
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            userHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> userRequest = new HttpEntity<>(userHeaders);
            ResponseEntity<String> userResponse = restTemplate.postForEntity(userUrl, userRequest, String.class);

            JSONObject userJson = new JSONObject(userResponse.getBody());
            String providerId = String.valueOf(userJson.getLong("id"));
            
            JSONObject kakaoAccount = userJson.optJSONObject("kakao_account");
            String email = (kakaoAccount != null && kakaoAccount.has("email")) 
                    ? kakaoAccount.getString("email") : providerId + "@kakao.com";
            
            JSONObject properties = userJson.optJSONObject("properties");
            String nickname = (properties != null && properties.has("nickname")) 
                    ? properties.getString("nickname") : "카카오 사용자";

            return processSocialLogin("KAKAO", providerId, email, nickname);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            System.err.println("[5MIN] Kakao API Error Body: " + e.getResponseBodyAsString());
            throw new RuntimeException("카카오 서버 오류: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("카카오 로그인 처리 중 오류 발생: " + e.getMessage(), e);
        }
    }

    // 구글 인가 코드로 토큰 발급 및 사용자 정보 조회 후 로그인 처리
    @Transactional
    public User loginWithGoogle(String code, String redirectUri) {
        try {
            // 1. 토큰 발급
            String tokenUrl = "https://oauth2.googleapis.com/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", googleClientId);
            params.add("client_secret", googleClientSecret);
            params.add("redirect_uri", redirectUri);
            params.add("code", code);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);

            JSONObject tokenJson = new JSONObject(response.getBody());
            String accessToken = tokenJson.getString("access_token");

            // 2. 사용자 정보 조회
            String userUrl = "https://www.googleapis.com/userinfo/v2/me";
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);

            HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);
            ResponseEntity<String> userResponse = restTemplate.exchange(userUrl, HttpMethod.GET, userRequest, String.class);

            JSONObject userJson = new JSONObject(userResponse.getBody());
            String providerId = userJson.getString("id");
            String email = userJson.optString("email", providerId + "@google.com");
            String name = userJson.optString("name", "구글 사용자");

            return processSocialLogin("GOOGLE", providerId, email, name);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            System.err.println("[5MIN] Google API Error: " + e.getResponseBodyAsString());
            throw new RuntimeException("구글 서버 오류: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("구글 로그인 처리 중 오류 발생: " + e.getMessage(), e);
        }
    }

    // 회원가입 — 위치 정보(위도/경도) 함께 저장, 비밀번호 BCrypt 해싱
    @Transactional
    public User signup(String name, String email, String password, String phone,
                       Double latitude, Double longitude) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        if (phone != null && !phone.isBlank() && userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("이미 사용 중인 전화번호입니다.");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone);
        user.setLatitude(latitude);
        user.setLongitude(longitude);
        user.setInfoCompleted(true); // 일반 가입은 필수 정보 입력 완료
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

    // 의료 정보 업데이트 및 필수 정보 입력 완료 처리
    @Transactional
    public User updateMedicalInfo(Long userId, String bloodType, String chronicDisease, 
                                 String emergencyContact, String carInfo, String medications) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setBloodType(bloodType);
        user.setChronicDisease(chronicDisease);
        user.setEmergencyContact(emergencyContact);
        user.setCarInfo(carInfo);
        user.setMedications(medications);
        user.setInfoCompleted(true); // 입력 완료 설정
        return userRepository.save(user);
    }

    // 사용자 프로필 조회
    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    // 이름 + 전화번호로 이메일 찾기 (마스킹 처리)
    public String findEmailByNameAndPhone(String name, String phone) {
        User user = userRepository.findByNameAndPhone(name, phone)
                .orElseThrow(() -> new IllegalArgumentException("일치하는 계정 정보가 없습니다."));
        return maskEmail(user.getEmail());
    }

    // 이메일 중간 마스킹: 앞 2자 + *** + 뒤 1자 + @domain
    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at < 0) return email;
        String local = email.substring(0, at);
        String domain = email.substring(at);
        if (local.length() <= 3) {
            return local.charAt(0) + "*".repeat(Math.max(1, local.length() - 1)) + domain;
        }
        int showStart = 2;
        int showEnd   = 1;
        String stars  = "*".repeat(local.length() - showStart - showEnd);
        return local.substring(0, showStart) + stars + local.substring(local.length() - showEnd) + domain;
    }

    // 6자리 인증코드 생성 후 이메일 발송 (5분 유효)
    public void sendVerificationCode(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일로 가입된 계정이 없습니다."));

        String code = String.format("%06d", (int)(Math.random() * 1_000_000));
        verifyCodeStore.put(email, new CodeRecord(code, LocalDateTime.now().plusMinutes(5)));

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mailFrom);
        msg.setTo(email);
        msg.setSubject("[5분] 비밀번호 재설정 인증번호");
        msg.setText("인증번호: " + code + "\n\n5분 이내에 입력해주세요.\n요청하지 않으셨다면 무시하세요.");
        mailSender.send(msg);
    }

    // 인증코드 확인
    public boolean verifyCode(String email, String code) {
        CodeRecord record = verifyCodeStore.get(email);
        if (record == null) return false;
        if (LocalDateTime.now().isAfter(record.expiresAt())) {
            verifyCodeStore.remove(email);
            return false;
        }
        return record.code().equals(code);
    }

    // 인증코드 검증 후 비밀번호 재설정
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        if (!verifyCode(email, code)) {
            throw new IllegalArgumentException("인증 코드가 올바르지 않거나 만료되었습니다.");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        verifyCodeStore.remove(email);
    }
}
