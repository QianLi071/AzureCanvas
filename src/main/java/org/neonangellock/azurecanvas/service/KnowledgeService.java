package org.neonangellock.azurecanvas.service;

import lombok.extern.slf4j.Slf4j;
import org.neonangellock.azurecanvas.model.es.EsKnowledge;
import org.neonangellock.azurecanvas.repository.EsKnowledgeRepository;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class KnowledgeService {
    private final ElasticsearchOperations elasticsearchOperations;
    private final EsKnowledgeRepository repository;

    public KnowledgeService(ElasticsearchOperations elasticsearchOperations, EsKnowledgeRepository repository) {
        this.elasticsearchOperations = elasticsearchOperations;
        this.repository = repository;
    }

    public List<EsKnowledge> search(String keyword) {
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return (List<EsKnowledge>) repository.findAll();
            }

            Criteria criteria = new Criteria("title").matches(keyword)
                    .or(new Criteria("content").matches(keyword));

            CriteriaQuery query = new CriteriaQuery(criteria);

            SearchHits<EsKnowledge> searchHits = elasticsearchOperations.search(query, EsKnowledge.class);

            if (searchHits == null || !searchHits.hasSearchHits()) {
                log.info("知识库未找到与 '{}' 相关的内容", keyword);
                return List.of();
            }

            List<EsKnowledge> results = searchHits.getSearchHits().stream()
                    .map(hit -> hit.getContent())
                    .collect(Collectors.toList());

            log.info("知识库搜索 '{}' 找到 {} 条相关内容", keyword, results.size());
            return results;
        } catch (Exception e) {
            log.error("知识库搜索失败: {}", e.getMessage(), e);
            return List.of();
        }
    }

    public String getKnowledgeContext(String keyword, int maxResults) {
        try {
            List<EsKnowledge> results = search(keyword);

            if (results.isEmpty()) {
                return "";
            }

            StringBuilder contextBuilder = new StringBuilder();
            contextBuilder.append("\n\n【AzureCanvas 项目知识库参考信息】\n");

            int count = 0;
            for (EsKnowledge knowledge : results) {
                if (count >= maxResults) break;

                contextBuilder.append("\n--- ").append(knowledge.getTitle()).append(" ---\n");
                String content = knowledge.getContent();

                if (content.length() > 2000) {
                    content = content.substring(0, 2000) + "...(内容过长已截断)";
                }
                contextBuilder.append(content).append("\n");

                count++;
            }

            contextBuilder.append("\n请基于以上项目信息回答用户问题。如果问题与项目无关，可以忽略此信息。");
            return contextBuilder.toString();
        } catch (Exception e) {
            log.error("获取知识库上下文失败: {}", e.getMessage());
            return "";
        }
    }
}