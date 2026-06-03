package com.fivemin.service;

import com.fivemin.entity.Favorite;
import com.fivemin.entity.Hospital;
import com.fivemin.entity.User;
import com.fivemin.repository.FavoriteRepository;
import com.fivemin.repository.HospitalRepository;
import com.fivemin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    // 즐겨찾기 목록 조회
    public List<Favorite> getFavorites(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        return favoriteRepository.findByUserId(user.getId());
    }

    // 즐겨찾기 추가
    @Transactional
    public Favorite addFavorite(String email, String hpid) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        Hospital hospital = hospitalRepository.findById(hpid)
                .orElseThrow(() -> new RuntimeException("병원을 찾을 수 없습니다"));

        // 이미 즐겨찾기 된 병원인지 체크
        if (favoriteRepository.existsByUserIdAndHospitalHpid(user.getId(), hpid)) {
            throw new RuntimeException("이미 즐겨찾기에 추가된 병원입니다");
        }

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setHospital(hospital);

        return favoriteRepository.save(favorite);
    }

    // 즐겨찾기 삭제
    @Transactional
    public void deleteFavorite(String email, String hpid) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        favoriteRepository.deleteByUserIdAndHospitalHpid(user.getId(), hpid);
    }

    // 즐겨찾기 여부 확인
    public boolean isFavorite(String email, String hpid) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        return favoriteRepository.existsByUserIdAndHospitalHpid(user.getId(), hpid);
    }
}