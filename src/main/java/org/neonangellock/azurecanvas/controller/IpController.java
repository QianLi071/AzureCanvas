package org.neonangellock.azurecanvas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
public class IpController {

    @GetMapping("/api/ip-location")
    public Map<String, Object> getIpLocation() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            // 使用稳定且支持跨域请求的公共 API
            String url = "http://ip-api.com/json/?fields=status,country,city,lat,lon";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "success".equals(response.get("status"))) {
                Map<String, Object> result = new HashMap<>();
                result.put("latitude", response.get("lat"));
                result.put("longitude", response.get("lon"));
                result.put("city", response.get("city"));
                result.put("country", response.get("country"));
                return result;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        // 失败时返回空地图，前端会提示定位失败并回退
        return new HashMap<>();
    }
}
