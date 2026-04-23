package org.neonangellock.azurecanvas.service.impl;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.es.EsItem;
import org.neonangellock.azurecanvas.repository.ItemRepository;
import org.neonangellock.azurecanvas.repository.es.EsItemRepository;
import org.neonangellock.azurecanvas.service.EsItemService;
import org.springframework.beans.BeanUtils;
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
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EsItemServiceImpl implements EsItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private EsItemRepository esItemRepository;

    @Autowired
    private ElasticsearchOperations elasticsearchOperations;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String TEST_DATA_URL = "https://api.szsummer.com/test/trade/data";

    @Override
    public SearchHits<EsItem> searchItems(String keyword, int page, int size) {
        // 1. 先从远程 API 获取数据并同步到本地 ES
        try {
            System.out.println("Fetching remote test data for sync to local ES...");
            String remoteDataStr = restTemplate.getForObject(TEST_DATA_URL, String.class);
            System.out.println("Remote data string length: " + (remoteDataStr != null ? remoteDataStr.length() : 0));

            List<EsItem> esItems = new ArrayList<>();
            if (remoteDataStr != null && !remoteDataStr.isEmpty()) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    Object remoteData = objectMapper.readValue(remoteDataStr, Object.class);

                    List<Map<String, Object>> dataList = new ArrayList<>();

                    // 处理 API 返回的数据，无论是数组还是对象
                    if (remoteData instanceof List) {
                        System.out.println("Remote data is a List, size: " + ((List<?>) remoteData).size());
                        dataList = (List<Map<String, Object>>) remoteData;
                    } else if (remoteData instanceof Map) {
                        System.out.println("Remote data is a Map, keys: " + ((Map<?, ?>) remoteData).keySet());
                        Map<?, ?> remoteMap = (Map<?, ?>) remoteData;
                        for (Object key : remoteMap.keySet()) {
                            Object value = remoteMap.get(key);
                            if (value instanceof List) {
                                System.out.println("Value is a List, size: " + ((List<?>) value).size());
                                dataList.addAll((List<Map<String, Object>>) value);
                            }
                        }
                    }

                    // 将远程数据转换为 EsItem 并保存到本地 ES
                    for (Map<String, Object> data : dataList) {
                        EsItem item = new EsItem();
                        item.setId(String.valueOf(data.get("id")));
                        item.setTitle((String) data.get("title"));
                        item.setDescription((String) data.getOrDefault("description", ""));

                        Object priceObj = data.get("price");
                        if (priceObj != null) {
                            item.setPrice(new java.math.BigDecimal(priceObj.toString()));
                        }

                        item.setCategory((String) data.getOrDefault("category", ""));
                        item.setLocation((String) data.getOrDefault("location", ""));
                        item.setStatus((String) data.getOrDefault("status", ""));

                        Object viewsObj = data.get("views");
                        if (viewsObj != null) {
                            item.setViews(((Number) viewsObj).intValue());
                        }

                        esItems.add(item);
                    }

                    // 批量保存到本地 ES 索引
                    if (!esItems.isEmpty()) {
                        System.out.println("Saving " + esItems.size() + " items to local ES index...");
                        esItemRepository.saveAll(esItems);
                        System.out.println("Successfully saved items to local ES index");
                    }
                } catch (JsonProcessingException e) {
                    System.err.println("Failed to parse JSON data: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to sync remote data to local ES: " + e.getMessage());
        }

        // 2. 使用本地 ES 进行搜索
        try {
            if (elasticsearchOperations != null) {
                NativeQuery query = NativeQuery.builder()
                        .withQuery(q -> q.multiMatch(m -> m.fields("title", "description").query(keyword)))
                        .withPageable(PageRequest.of(page, size))
                        .withHighlightQuery(new HighlightQuery(
                                new Highlight(List.of(new HighlightField("title"), new HighlightField("description"))),
                                EsItem.class))
                        .build();
                System.out.println("Searching in local ES with keyword: " + keyword);
                return elasticsearchOperations.search(query, EsItem.class);
            }
        } catch (Exception e) {
            System.err.println("Local ES search failed: " + e.getMessage());
            e.printStackTrace();
        }

        // 返回空结果
        return new SearchHits<EsItem>() {
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
            public List<org.springframework.data.elasticsearch.core.SearchHit<EsItem>> getSearchHits() {
                return Collections.emptyList();
            }

            @Override
            public org.springframework.data.elasticsearch.core.SearchHit<EsItem> getSearchHit(int index) {
                throw new IndexOutOfBoundsException();
            }

            @Override
            public List<EsItem> getSearchHitsContents() {
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
    @Transactional(readOnly = true)
    @Scheduled(fixedRate = 300000)
    public void syncItemsFromDb() {
        try {
            List<Item> items = itemRepository.findAll();
            List<EsItem> esItems = items.stream().map(item -> {
                EsItem esItem = new EsItem();
                BeanUtils.copyProperties(item, esItem);
                esItem.setId(item.getItemId().toString());
                if (item.getCreatedAt() != null) {
                    esItem.setCreatedAt(item.getCreatedAt().toString());
                }
                return esItem;
            }).collect(Collectors.toList());
            esItemRepository.saveAll(esItems);
        } catch (Exception e) {
            System.err.println("Elasticsearch sync failed: " + e.getMessage());
        }
    }
}
