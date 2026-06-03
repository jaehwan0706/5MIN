package com.fivemin.controller;

import com.fivemin.entity.Favorite;
import com.fivemin.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    // 즐겨찾기 목록 조회
    // GET /api/favorites
    @GetMapping
    public ResponseEntity<List<Favorite>> getFavorites(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(favoriteService.getFavorites(email));
    }

    // 즐겨찾기 추가
    // POST /api/favorites/{hpid}
    @PostMapping("/{hpid}")
    public ResponseEntity<Favorite> addFavorite(
            @AuthenticationPrincipal String email,
            @PathVariable String hpid) {
        return ResponseEntity.ok(favoriteService.addFavorite(email, hpid));
    }

    // 즐겨찾기 삭제
    // DELETE /api/favorites/{hpid}
    @DeleteMapping("/{hpid}")
    public ResponseEntity<Void> deleteFavorite(
            @AuthenticationPrincipal String email,
            @PathVariable String hpid) {
        favoriteService.deleteFavorite(email, hpid);
        return ResponseEntity.noContent().build();
    }

    // 즐겨찾기 여부 확인
    // GET /api/favorites/{hpid}/check
    @GetMapping("/{hpid}/check")
    public ResponseEntity<Boolean> isFavorite(
            @AuthenticationPrincipal String email,
            @PathVariable String hpid) {
        return ResponseEntity.ok(favoriteService.isFavorite(email, hpid));
    }
}