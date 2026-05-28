package com.fivemin.controller;

import com.fivemin.service.EmergencyApiService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// 프론트엔드에서 사용하는 응급의료 API 요청을 받는 컨트롤러입니다.
@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    // 응급의료 공공데이터 API 호출을 담당하는 서비스입니다.
    private final EmergencyApiService emergencyApiService;

    // 생성자 주입으로 EmergencyApiService를 전달받습니다.
    public EmergencyController(EmergencyApiService emergencyApiService) {
        this.emergencyApiService = emergencyApiService;
    }

    // [Tab01/Tab03] 실시간 응급실 병상 정보를 조회합니다.
    // 호출 예시: GET /api/emergency/beds?stage1=서울
    // 호출 예시: GET /api/emergency/beds?stage1=서울&stage2=강남구
    @GetMapping(value = "/beds", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getBeds(
            @RequestParam String stage1,
            @RequestParam(required = false, defaultValue = "") String stage2) {
        return jsonResponse(emergencyApiService.getBeds(stage1, stage2));
    }

    // [Tab02] 소아 응급 병상 확인에 필요한 실시간 병상 정보를 조회합니다.
    // 호출 예시: GET /api/emergency/pediatric?stage1=서울
    @GetMapping(value = "/pediatric", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getPediatricBeds(@RequestParam String stage1) {
        return jsonResponse(emergencyApiService.getPediatricBeds(stage1));
    }

    // [Tab01] CT/MRI 등 중증질환자 수용 가능 정보를 조회합니다.
    // 호출 예시: GET /api/emergency/severe?stage1=서울
    // 호출 예시: GET /api/emergency/severe?stage1=서울&stage2=강남구
    @GetMapping(value = "/severe", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getSeverePatientInfo(
            @RequestParam String stage1,
            @RequestParam(required = false, defaultValue = "") String stage2) {
        return jsonResponse(emergencyApiService.getSeverePatientInfo(stage1, stage2));
    }

    // [Tab01] 병원 ID(HPID) 기준으로 응급실 및 중증질환 제한 메시지를 조회합니다.
    // 호출 예시: GET /api/emergency/message?hpid=A1100001
    @GetMapping(value = "/message", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getEmergencyMessage(@RequestParam String hpid) {
        return jsonResponse(emergencyApiService.getEmergencyMessage(hpid));
    }

    // [Tab03] 병원 지도 마커용 위치 정보를 조회합니다.
    // 호출 예시: GET /api/emergency/location?stage1=서울
    // 호출 예시: GET /api/emergency/location?stage1=서울&stage2=강남구
    @GetMapping(value = "/location", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getHospitalLocation(
            @RequestParam String stage1,
            @RequestParam(required = false, defaultValue = "") String stage2) {
        return jsonResponse(emergencyApiService.getHospitalLocation(stage1, stage2));
    }

    // 공공데이터 API에서 받은 JSON 문자열을 UTF-8 JSON 응답으로 반환합니다.
    private ResponseEntity<String> jsonResponse(String body) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/json;charset=UTF-8"))
                .body(body);
    }
}
