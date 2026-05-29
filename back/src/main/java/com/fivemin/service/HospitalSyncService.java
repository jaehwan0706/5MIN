package com.fivemin.service;

import com.fivemin.entity.Hospital;
import com.fivemin.repository.HospitalRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.json.JSONArray;
import org.json.JSONObject;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 병원 기본정보를 API에서 가져와 DB에 저장하는 서비스
// 1일 1회 자동 갱신
@Service
public class HospitalSyncService {

    @Value("${emergency.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final HospitalRepository hospitalRepository;

    public HospitalSyncService(RestTemplate restTemplate, HospitalRepository hospitalRepository) {
        this.restTemplate = restTemplate;
        this.hospitalRepository = hospitalRepository;
    }

    // 매일 새벽 3시에 자동 실행
    @Scheduled(cron = "0 0 3 * * *")
    public void syncHospitals() {
        System.out.println("[5MIN] 병원 정보 동기화 시작...");
        fetchAndSave();
        System.out.println("[5MIN] 병원 정보 동기화 완료!");
    }

    // 병원 정보 API 호출 후 DB 저장
    public void fetchAndSave() {
        String url = "https://apis.data.go.kr/B552657/ErmctInfoInqireService/"
                + "getEgytListInfoInqire"
                + "?serviceKey=" + apiKey
                + "&pageNo=1&numOfRows=500&_type=json";

        String response = restTemplate.getForObject(url, String.class);

        // JSON 파싱
        JSONObject json = new JSONObject(response);
        JSONArray items = json
                .getJSONObject("response")
                .getJSONObject("body")
                .getJSONObject("items")
                .getJSONArray("item");

        List<Hospital> hospitals = new ArrayList<>();

        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            Hospital hospital = new Hospital();

            hospital.setHpid(item.optString("hpid"));
            hospital.setDutyName(item.optString("dutyName"));
            hospital.setDutyTel1(item.optString("dutyTel1"));
            hospital.setDutyAddr(item.optString("dutyAddr"));
            hospital.setWgs84Lat(item.optDouble("wgs84Lat", 0.0));
            hospital.setWgs84Lon(item.optDouble("wgs84Lon", 0.0));
            hospital.setDutyEmcls(item.optString("dutyEmcls"));
            hospital.setDutyEmclsName(item.optString("dutyEmclsName"));
            hospital.setUpdatedAt(LocalDateTime.now());

            hospitals.add(hospital);
        }

        // DB에 저장 (있으면 업데이트, 없으면 신규 저장)
        hospitalRepository.saveAll(hospitals);
    }
}