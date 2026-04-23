package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.es.EsTreeHole;
import org.neonangellock.azurecanvas.repository.es.EsTreeHoleRepository;
import org.neonangellock.azurecanvas.service.EsTreeHoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.SearchShardStatistics;
import org.springframework.data.elasticsearch.core.suggest.response.Suggest;
import org.springframework.data.elasticsearch.core.query.HighlightQuery;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class EsTreeHoleServiceImpl implements EsTreeHoleService {

    @Autowired
    private EsTreeHoleRepository esTreeHoleRepository;

    @Autowired
    private ElasticsearchOperations elasticsearchOperations;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String TREEHOLE_API_URL = "https://api.szsummer.com/test/treehole/data";

    @Override
    public SearchHits<EsTreeHole> searchTreeHole(String keyword, int page, int size) {
        // 1. 先从远程 API 获取数据并同步到本地 ES
        try {
            System.out.println("Fetching remote treehole data for sync to local ES...");
            String remoteDataStr = restTemplate.getForObject(TREEHOLE_API_URL, String.class);
            System.out.println(
                    "Remote treehole data string length: " + (remoteDataStr != null ? remoteDataStr.length() : 0));

            List<EsTreeHole> esTreeHoles = new ArrayList<>();
            if (remoteDataStr != null && !remoteDataStr.isEmpty()) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    Object remoteData = objectMapper.readValue(remoteDataStr, Object.class);

                    List<Map<String, Object>> dataList = new ArrayList<>();

                    // 处理 API 返回的数据，无论是数组还是对象
                    if (remoteData instanceof List) {
                        System.out.println("Remote treehole data is a List, size: " + ((List<?>) remoteData).size());
                        dataList = (List<Map<String, Object>>) remoteData;
                    } else if (remoteData instanceof Map) {
                        System.out.println("Remote treehole data is a Map, keys: " + ((Map<?, ?>) remoteData).keySet());
                        Map<?, ?> remoteMap = (Map<?, ?>) remoteData;
                        for (Object key : remoteMap.keySet()) {
                            Object value = remoteMap.get(key);
                            if (value instanceof List) {
                                System.out.println("Value is a List, size: " + ((List<?>) value).size());
                                dataList.addAll((List<Map<String, Object>>) value);
                            }
                        }
                    }

                    // 将远程数据转换为 EsTreeHole 并保存到本地 ES
                    for (Map<String, Object> data : dataList) {
                        EsTreeHole item = new EsTreeHole();
                        item.setId(String.valueOf(data.getOrDefault("id", "")));
                        item.setBoardName((String) data.getOrDefault("board_name", ""));
                        item.setTitle((String) data.getOrDefault("title", ""));
                        item.setContent((String) data.getOrDefault("content", ""));

                        esTreeHoles.add(item);
                    }

                    // 批量保存到本地 ES 索引
                    if (!esTreeHoles.isEmpty()) {
                        System.out.println("Saving " + esTreeHoles.size() + " treehole items to local ES index...");
                        esTreeHoleRepository.saveAll(esTreeHoles);
                        System.out.println("Successfully saved treehole items to local ES index");
                    }
                } catch (JsonProcessingException e) {
                    System.err.println("Failed to parse treehole JSON data: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to sync remote treehole data to local ES: " + e.getMessage());
        }

        // 2. 使用本地 ES 进行搜索
        try {
            if (elasticsearchOperations != null) {
                NativeQuery query = NativeQuery.builder()
                        .withQuery(q -> q.multiMatch(m -> m.fields("title", "content").query(keyword)))
                        .withPageable(PageRequest.of(page, size))
                        .withHighlightQuery(new HighlightQuery(
                                new Highlight(List.of(new HighlightField("title"), new HighlightField("content"))),
                                EsTreeHole.class))
                        .build();
                System.out.println("Searching treehole in local ES with keyword: " + keyword);
                return elasticsearchOperations.search(query, EsTreeHole.class);
            }
        } catch (Exception e) {
            System.err.println("Local ES treehole search failed: " + e.getMessage());
            e.printStackTrace();
        }

        // 返回空结果
        return new SearchHits<EsTreeHole>() {
            @Override
            public long getTotalHits() {
                return 0;
            }

            @Override
            public org.springframework.data.elasticsearch.core.TotalHitsRelation getTotalHitsRelation() {
                return org.springframework.data.elasticsearch.core.TotalHitsRelation.EQUAL_TO;
            }

            @Override
            public float getMaxScore() {
                return 0f;
            }

            @Override
            public Suggest getSuggest() {
                return null;
            }

            @Override
            public List<org.springframework.data.elasticsearch.core.SearchHit<EsTreeHole>> getSearchHits() {
                return Collections.emptyList();
            }

            @Override
            public org.springframework.data.elasticsearch.core.SearchHit<EsTreeHole> getSearchHit(int index) {
                throw new IndexOutOfBoundsException();
            }

            @Override
            public List<EsTreeHole> getSearchHitsContents() {
                return Collections.emptyList();
            }

            @Override
            public boolean hasSearchHits() {
                return false;
            }

            @Override
            public org.springframework.data.elasticsearch.core.AggregationsContainer<?> getAggregations() {
                return null;
            }

            @Override
            public <T> T getAggregation(String name, Class<T> aClass) {
                return null;
            }

            @Override
            public SearchShardStatistics getSearchShardStatistics() {
                return null;
            }

            @Override
            public String getPointInTimeId() {
                return null;
            }

            @Override
            public java.time.Duration getExecutionDuration() {
                return java.time.Duration.ZERO;
            }
        };
    }

    @Override
    public void syncTreeHoleFromApi() {
        searchTreeHole("", 0, 100); // 同步所有数据
    }
}
