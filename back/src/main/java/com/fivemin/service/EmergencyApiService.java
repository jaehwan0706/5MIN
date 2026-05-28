package com.fivemin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class EmergencyApiService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyApiService.class);
    private static final String BASE_URL = "https://apis.data.go.kr/B552657/ErmctInfoInqireService/";

    // 시도명 약칭을 공공데이터 API가 요구하는 정식 시도명으로 변환합니다.
    private static final Map<String, String> STAGE1_ALIASES = Map.ofEntries(
            Map.entry("서울", "서울특별시"),
            Map.entry("부산", "부산광역시"),
            Map.entry("대구", "대구광역시"),
            Map.entry("인천", "인천광역시"),
            Map.entry("광주", "광주광역시"),
            Map.entry("대전", "대전광역시"),
            Map.entry("울산", "울산광역시"),
            Map.entry("세종", "세종특별자치시"),
            Map.entry("경기", "경기도"),
            Map.entry("강원", "강원특별자치도"),
            Map.entry("충북", "충청북도"),
            Map.entry("충남", "충청남도"),
            Map.entry("전북", "전북특별자치도"),
            Map.entry("전남", "전라남도"),
            Map.entry("경북", "경상북도"),
            Map.entry("경남", "경상남도"),
            Map.entry("제주", "제주특별자치도")
    );

    // stage2 없이 시도만 조회할 때 순회할 시군구 목록입니다.
    private static final Map<String, List<String>> DISTRICTS_BY_STAGE1 = Map.ofEntries(
            Map.entry("서울특별시", List.of("강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구")),
            Map.entry("부산광역시", List.of("강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구")),
            Map.entry("대구광역시", List.of("군위군", "남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구")),
            Map.entry("인천광역시", List.of("강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구")),
            Map.entry("광주광역시", List.of("광산구", "남구", "동구", "북구", "서구")),
            Map.entry("대전광역시", List.of("대덕구", "동구", "서구", "유성구", "중구")),
            Map.entry("울산광역시", List.of("남구", "동구", "북구", "울주군", "중구")),
            Map.entry("세종특별자치시", List.of("")),
            Map.entry("제주특별자치도", List.of("서귀포시", "제주시"))
    );

    // application.yml의 emergency.api.key 값을 주입받습니다.
    @Value("${emergency.api.key}")
    private String apiKey;

    // 외부 API 호출에 사용할 RestTemplate Bean입니다.
    private final RestTemplate restTemplate;

    // 생성자 주입으로 RestTemplate을 전달받습니다.
    public EmergencyApiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // [Tab01/Tab03] 실시간 응급실 병상 정보를 조회합니다. stage2가 없으면 해당 시도 전체를 조회합니다.
    public String getBeds(String stage1, String stage2) {
        return getAreaData("getEmrrmRltmUsefulSckbdInfoInqire", stage1, stage2);
    }

    // [Tab02] 소아 응급 병상 확인에 필요한 실시간 병상 정보를 조회합니다.
    public String getPediatricBeds(String stage1) {
        return getAreaData("getEmrrmRltmUsefulSckbdInfoInqire", stage1, "");
    }

    // [Tab01] CT/MRI 등 중증질환자 수용 가능 정보를 조회합니다.
    public String getSeverePatientInfo(String stage1, String stage2) {
        return getAreaData("getSrsillDissAceptncPosblInfoInqire", stage1, stage2);
    }

    // 응급실 중증질환 제한 메시지를 조회합니다. stage 없으면 전체, 있으면 dutyAddr 기준 지역 필터링합니다.
    // (이 API는 STAGE1/STAGE2 파라미터를 지원하지 않으므로 전체 조회 후 클라이언트 필터링)
    public String getEmergencyMessage(String stage1, String stage2) {
        URI uri = UriComponentsBuilder.fromUriString(BASE_URL + "getEmrrmSrsillDissMsgInqire")
                .queryParam("serviceKey", apiKey)
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 1000)
                .queryParam("_type", "json")
                .encode()
                .build()
                .toUri();

        String allData = callEmergencyApi(uri);

        String normalizedStage1 = normalizeStage1(stage1);
        if (normalizedStage1.isBlank()) {
            return allData;
        }

        String trimmedStage2 = (stage2 != null) ? stage2.trim() : "";

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(allData);
            JsonNode items = root.path("response").path("body").path("items").path("item");

            List<JsonNode> filtered = new ArrayList<>();
            for (JsonNode item : items) {
                String addr = item.path("dutyAddr").asText("");
                if (addr.contains(normalizedStage1)) {
                    if (trimmedStage2.isEmpty() || addr.contains(trimmedStage2)) {
                        filtered.add(item);
                    }
                }
            }

            String filteredJson = mapper.writeValueAsString(filtered);
            return "{\"response\":{\"header\":{\"resultCode\":\"00\",\"resultMsg\":\"NORMAL SERVICE.\"},"
                    + "\"body\":{\"items\":{\"item\":" + filteredJson + "},"
                    + "\"numOfRows\":1000,\"pageNo\":1,\"totalCount\":" + filtered.size() + "}}}";
        } catch (Exception e) {
            log.error("Failed to filter message data by stage. stage1={}, stage2={}", stage1, stage2, e);
            return allData;
        }
    }

    // [Tab03] 병원 지도 마커용 위치 정보를 조회합니다. stage2가 없으면 해당 시도 전체를 조회합니다.
    public String getHospitalLocation(String stage1, String stage2) {
        return getAreaData("getEgytBassInfoInqire", stage1, stage2);
    }

    // 시도/시군구 기반 API를 호출합니다. 시도가 없으면 전체 조회, 시군구가 없으면 해당 시도 전체를 조회합니다.
    private String getAreaData(String endpoint, String stage1, String stage2) {
        String normalizedStage1 = normalizeStage1(stage1);

        // stage1 없으면 STAGE1 파라미터 없이 호출 → 전체 조회
        if (normalizedStage1.isBlank()) {
            URI uri = buildAreaUri(endpoint, "", "");
            return callEmergencyApi(uri);
        }

        if (stage2 != null && !stage2.isBlank()) {
            URI uri = buildAreaUri(endpoint, normalizedStage1, stage2.trim());
            return callEmergencyApi(uri);
        }

        List<String> districts = DISTRICTS_BY_STAGE1.get(normalizedStage1);
        if (districts == null) {
            URI uri = buildAreaUri(endpoint, normalizedStage1, "");
            return callEmergencyApi(uri);
        }

        StringBuilder items = new StringBuilder();
        int totalCount = 0;

        for (String district : districts) {
            URI uri = buildAreaUri(endpoint, normalizedStage1, district);
            String response = callEmergencyApi(uri);
            totalCount += extractTotalCount(response);
            appendItems(items, response);
        }

        return buildMergedResponse(items, totalCount);
    }

    // 사용자가 입력한 시도명을 공공데이터 API가 요구하는 정식 명칭으로 변환합니다.
    private String normalizeStage1(String stage1) {
        if (stage1 == null || stage1.isBlank()) {
            return "";
        }

        String trimmed = stage1.trim();
        return STAGE1_ALIASES.getOrDefault(trimmed, trimmed);
    }

    // 시도(STAGE1), 시군구(STAGE2)를 사용하는 응급의료 API URL을 생성합니다. 값이 없으면 해당 파라미터를 생략합니다.
    private URI buildAreaUri(String endpoint, String stage1, String stage2) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(BASE_URL + endpoint)
                .queryParam("serviceKey", apiKey)
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 100)
                .queryParam("_type", "json");

        if (stage1 != null && !stage1.isBlank()) {
            builder.queryParam("STAGE1", stage1);
        }

        if (stage2 != null && !stage2.isBlank()) {
            builder.queryParam("STAGE2", stage2);
        }

        return builder.encode().build().toUri();
    }

    private String callEmergencyApi(URI uri) {
        try {
            String response = restTemplate.getForObject(uri, String.class);
            if (response != null && !response.stripLeading().startsWith("{")) {
                log.warn("Non-JSON response from emergency API — API key may be invalid. URI={}", uri);
            }
            return response;
        } catch (RestClientException e) {
            log.error("Emergency API call failed. URI={}, error={}", uri, e.getMessage());
            return """
                    {"response":{"header":{"resultCode":"EXTERNAL_API_ERROR","resultMsg":"%s"},"body":{"items":"","numOfRows":100,"pageNo":1,"totalCount":0}}}
                    """.formatted(escapeJson(e.getMessage()));
        }
    }

    private String buildMergedResponse(StringBuilder items, int totalCount) {
        if (items.isEmpty()) {
            log.warn("No items returned from emergency API — check API key in application.yml");
            return """
                    {"response":{"header":{"resultCode":"00","resultMsg":"NORMAL SERVICE."},"body":{"items":"","numOfRows":100,"pageNo":1,"totalCount":0}}}
                    """;
        }

        return """
                {"response":{"header":{"resultCode":"00","resultMsg":"NORMAL SERVICE."},"body":{"items":{"item":[%s]},"numOfRows":100,"pageNo":1,"totalCount":%d}}}
                """.formatted(items, totalCount);
    }

    // 공공데이터 응답에서 totalCount 값을 추출합니다.
    private int extractTotalCount(String json) {
        try {
            String keyword = "\"totalCount\":";
            int index = json.indexOf(keyword);
            if (index < 0) {
                return 0;
            }

            int start = index + keyword.length();
            int end = json.indexOf("}", start);
            int comma = json.indexOf(",", start);
            if (comma >= 0 && comma < end) {
                end = comma;
            }

            return Integer.parseInt(json.substring(start, end).trim());
        } catch (Exception e) {
            return 0;
        }
    }

    // 공공데이터 응답의 item 배열 또는 단일 item 객체를 합산용 문자열에 추가합니다.
    private void appendItems(StringBuilder target, String json) {
        int itemIndex = json.indexOf("\"item\":");
        if (itemIndex < 0) {
            return;
        }

        int valueStart = itemIndex + "\"item\":".length();
        while (valueStart < json.length() && Character.isWhitespace(json.charAt(valueStart))) {
            valueStart++;
        }

        if (valueStart >= json.length()) {
            return;
        }

        char firstChar = json.charAt(valueStart);
        if (firstChar == '[') {
            String arrayContent = extractBalancedContent(json, valueStart, '[', ']');
            appendItemContent(target, arrayContent);
        } else if (firstChar == '{') {
            String objectContent = extractBalancedValue(json, valueStart, '{', '}');
            appendItemContent(target, objectContent);
        }
    }

    // 배열 대괄호 안쪽 내용만 추출합니다.
    private String extractBalancedContent(String json, int start, char open, char close) {
        String value = extractBalancedValue(json, start, open, close);
        if (value.length() <= 2) {
            return "";
        }

        return value.substring(1, value.length() - 1).trim();
    }

    // 중괄호 또는 대괄호가 균형을 이루는 JSON 값을 추출합니다.
    private String extractBalancedValue(String json, int start, char open, char close) {
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;

        for (int i = start; i < json.length(); i++) {
            char current = json.charAt(i);

            if (escaped) {
                escaped = false;
                continue;
            }

            if (current == '\\') {
                escaped = true;
                continue;
            }

            if (current == '"') {
                inString = !inString;
                continue;
            }

            if (inString) {
                continue;
            }

            if (current == open) {
                depth++;
            } else if (current == close) {
                depth--;
                if (depth == 0) {
                    return json.substring(start, i + 1);
                }
            }
        }

        return "";
    }

    // 합쳐진 item 목록에 쉼표를 맞춰 추가합니다.
    private void appendItemContent(StringBuilder target, String content) {
        if (content == null || content.isBlank()) {
            return;
        }

        if (!target.isEmpty()) {
            target.append(",");
        }
        target.append(content);
    }

    // 외부 API 오류 메시지를 JSON 문자열 안에 안전하게 넣기 위해 특수문자를 이스케이프합니다.
    private String escapeJson(String value) {
        if (value == null || value.isBlank()) {
            return "External emergency API request failed";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }
}
