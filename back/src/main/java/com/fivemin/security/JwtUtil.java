package com.fivemin.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // application.yml에서 시크릿 키 가져오기
    @Value("${jwt.secret}")
    private String secret;

    // application.yml에서 액세스 토큰 만료시간 가져오기 (1시간)
    @Value("${jwt.expiration}")
    private Long expiration;

    // application.yml에서 리프레시 토큰 만료시간 가져오기 (30일)
    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    // 액세스 토큰 생성 (로그인/회원가입 시 발급)
    public String generateAccessToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)          // 토큰 주인 (이메일)
                .claim("role", role)        // 권한 정보
                .claim("type", "access")    // 토큰 타입
                .setIssuedAt(new Date())    // 발급 시간
                .setExpiration(new Date(System.currentTimeMillis() + expiration)) // 만료 시간
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // 서명
                .compact();
    }

    // 리프레시 토큰 생성 (액세스 토큰 만료 시 재발급용)
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰에서 이메일 추출
    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }

    // 토큰에서 권한 추출
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("토큰이 만료되었습니다");
        } catch (JwtException e) {
            throw new RuntimeException("유효하지 않은 토큰입니다");
        }
    }

    // 토큰에서 Claims(데이터) 파싱
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 시크릿 키를 암호화 키 객체로 변환
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}