package com.fivemin.controller;

import com.fivemin.entity.User;
import com.fivemin.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.json.JSONObject;

// 사용자 회원가입/로그인/위치 업데이트 API
@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 회원가입 (위치 포함)
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody SignupRequest req) {
        User user = userService.signup(
                req.name, req.email, req.password, req.phone, req.latitude, req.longitude);
        return ResponseEntity.ok(toUserResponse(user, "회원가입 성공"));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        Optional<User> user = userService.login(req.email, req.password);
        if (user.isPresent()) {
            return ResponseEntity.ok(toUserResponse(user.get(), "로그인 성공"));
        }
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("error", "이메일 또는 비밀번호가 올바르지 않습니다.");
        return ResponseEntity.status(401).body(error);
    }

    // 소셜 로그인 (카카오/구글)
    @PostMapping("/login/social")
    public ResponseEntity<Map<String, Object>> socialLogin(@Valid @RequestBody SocialLoginRequest req) {
        try {
            User user = userService.processSocialLogin(
                    req.provider, req.providerId, req.email, req.name);
            return ResponseEntity.ok(toUserResponse(user, "소셜 로그인 성공"));
        } catch (Exception e) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "서버 내부 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // 구글 로그인 (인가 코드로 처리) — 웹 redirect 콜백용
    @PostMapping("/login/google")
    public ResponseEntity<Map<String, Object>> googleLogin(@Valid @RequestBody KakaoLoginRequest req) {
        try {
            User user = userService.loginWithGoogle(req.code, req.redirectUri);
            return ResponseEntity.ok(toUserResponse(user, "구글 로그인 성공"));
        } catch (Exception e) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "구글 로그인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // 카카오 전용 로그인 (인가 코드로 처리)
    @PostMapping("/login/kakao")
    public ResponseEntity<Map<String, Object>> kakaoLogin(@Valid @RequestBody KakaoLoginRequest req) {
        try {
            User user = userService.loginWithKakao(req.code, req.redirectUri);
            return ResponseEntity.ok(toUserResponse(user, "카카오 로그인 성공"));
        } catch (Exception e) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "카카오 로그인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // 카카오 OAuth 콜백 — Expo Go(exp://) 로 결과를 중계한다
    @GetMapping("/kakao/oauth-callback")
    public void kakaoOAuthCallback(
            @RequestParam("code") String code,
            @RequestParam(name = "state", required = false) String state,
            HttpServletRequest httpReq,
            HttpServletResponse response) throws IOException {

        // state 에 담긴 returnUrl / callbackUrl 파싱
        String returnUrl = "exp://localhost:8081";
        String callbackUrl = httpReq.getScheme() + "://" + httpReq.getServerName()
                + ":" + httpReq.getServerPort() + "/api/user/kakao/oauth-callback";

        if (state != null) {
            try {
                String decoded = new String(Base64.getDecoder().decode(state), StandardCharsets.UTF_8);
                JSONObject stateJson = new JSONObject(decoded);
                returnUrl  = stateJson.optString("returnUrl",  returnUrl);
                callbackUrl = stateJson.optString("callbackUrl", callbackUrl);
            } catch (Exception ignored) { }
        }

        try {
            User user = userService.loginWithKakao(code, callbackUrl);
            Map<String, Object> userMap = toUserResponse(user, null);
            String userJson = URLEncoder.encode(new JSONObject(userMap).toString(), StandardCharsets.UTF_8);
            response.sendRedirect(returnUrl + "?user=" + userJson);
        } catch (Exception e) {
            String errorMsg = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(returnUrl + "?error=" + errorMsg);
        }
    }

    // 구글 OAuth 콜백 — Expo Go(exp://) 로 결과를 중계한다
    @GetMapping("/google/oauth-callback")
    public void googleOAuthCallback(
            @RequestParam("code") String code,
            @RequestParam(name = "state", required = false) String state,
            HttpServletRequest httpReq,
            HttpServletResponse response) throws IOException {

        String returnUrl = "exp://localhost:8081";
        String callbackUrl = httpReq.getScheme() + "://" + httpReq.getServerName()
                + ":" + httpReq.getServerPort() + "/api/user/google/oauth-callback";

        if (state != null) {
            try {
                String decoded = new String(Base64.getDecoder().decode(state), StandardCharsets.UTF_8);
                JSONObject stateJson = new JSONObject(decoded);
                returnUrl  = stateJson.optString("returnUrl",  returnUrl);
                callbackUrl = stateJson.optString("callbackUrl", callbackUrl);
            } catch (Exception ignored) { }
        }

        try {
            User user = userService.loginWithGoogle(code, callbackUrl);
            Map<String, Object> userMap = toUserResponse(user, null);
            String userJson = URLEncoder.encode(new JSONObject(userMap).toString(), StandardCharsets.UTF_8);
            response.sendRedirect(returnUrl + "?user=" + userJson);
        } catch (Exception e) {
            String errorMsg = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(returnUrl + "?error=" + errorMsg);
        }
    }

    // 사용자 프로필 조회
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable(value = "id") Long id) {
        User user = userService.findById(id);
        return ResponseEntity.ok(toUserResponse(user, null));
    }

    // 위치 업데이트
    @PutMapping("/location/{id}")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @PathVariable(value = "id") Long id,
            @Valid @RequestBody LocationRequest req) {
        User user = userService.updateLocation(id, req.latitude, req.longitude);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("latitude", user.getLatitude());
        response.put("longitude", user.getLongitude());
        response.put("message", "위치 업데이트 성공");
        return ResponseEntity.ok(response);
    }

    // 추가 의료 정보 업데이트
    @PutMapping("/medical/{id}")
    public ResponseEntity<Map<String, Object>> updateMedicalInfo(
            @PathVariable(value = "id") Long id,
            @Valid @RequestBody MedicalInfoRequest req) {
        User user = userService.updateMedicalInfo(id, 
                req.bloodType, req.chronicDisease, req.emergencyContact,
                req.carInfo, req.medications);
        return ResponseEntity.ok(toUserResponse(user, "의료 정보 업데이트 성공"));
    }

    private Map<String, Object> toUserResponse(User user, String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("latitude", user.getLatitude());
        map.put("longitude", user.getLongitude());
        map.put("bloodType", user.getBloodType());
        map.put("chronicDisease", user.getChronicDisease());
        map.put("emergencyContact", user.getEmergencyContact());
        map.put("carInfo", user.getCarInfo());
        map.put("medications", user.getMedications());
        map.put("infoCompleted", user.getInfoCompleted());
        if (message != null) map.put("message", message);
        return map;
    }

    // 아이디 찾기 (이름 + 전화번호 → 마스킹된 이메일)
    @PostMapping("/find-id")
    public ResponseEntity<Map<String, Object>> findId(@Valid @RequestBody FindIdRequest req) {
        try {
            String maskedEmail = userService.findEmailByNameAndPhone(req.name, req.phone);
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("email", maskedEmail);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(404).body(err);
        }
    }

    // 비밀번호 찾기 — 인증코드 이메일 발송
    @PostMapping("/send-verify-code")
    public ResponseEntity<Map<String, Object>> sendVerifyCode(@Valid @RequestBody EmailRequest req) {
        try {
            userService.sendVerificationCode(req.email);
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("message", "인증코드가 발송되었습니다.");
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(404).body(err);
        } catch (Exception e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "이메일 발송에 실패했습니다. 이메일 주소를 확인해주세요.");
            return ResponseEntity.status(500).body(err);
        }
    }

    // 비밀번호 재설정 (인증코드 검증 + 새 비밀번호 저장)
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        try {
            userService.resetPassword(req.email, req.code, req.newPassword);
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("message", "비밀번호가 변경되었습니다.");
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(400).body(err);
        }
    }

    // ── Request DTOs ────────────────────────────────────────────────────────

    public static class SignupRequest {
        @NotBlank(message = "이름을 입력해주세요.")
        public String name;
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        public String email;
        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
        public String password;
        public String phone;
        public Double latitude;
        public Double longitude;
    }

    public static class LoginRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        public String email;
        @NotBlank(message = "비밀번호를 입력해주세요.")
        public String password;
    }

    public static class SocialLoginRequest {
        @NotBlank(message = "제공자(KAKAO/GOOGLE)를 입력해주세요.")
        public String provider;
        @NotBlank(message = "소셜 고유 ID를 입력해주세요.")
        public String providerId;
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        public String email;
        @NotBlank(message = "이름을 입력해주세요.")
        public String name;
    }

    public static class KakaoLoginRequest {
        @NotBlank(message = "인가 코드를 입력해주세요.")
        public String code;
        @NotBlank(message = "리다이렉트 URI를 입력해주세요.")
        public String redirectUri;
    }

    public static class LocationRequest {
        @NotNull(message = "위도를 입력해주세요.")
        public Double latitude;
        @NotNull(message = "경도를 입력해주세요.")
        public Double longitude;
    }

    public static class MedicalInfoRequest {
        public String bloodType;
        public String chronicDisease;
        public String emergencyContact;
        public String carInfo;
        public String medications;
    }

    public static class FindIdRequest {
        @NotBlank(message = "이름을 입력해주세요.")
        public String name;
        @NotBlank(message = "전화번호를 입력해주세요.")
        public String phone;
    }

    public static class EmailRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        public String email;
    }

    public static class ResetPasswordRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "유효한 이메일 형식이 아닙니다.")
        public String email;
        @NotBlank(message = "인증코드를 입력해주세요.")
        public String code;
        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
        public String newPassword;
    }
}
