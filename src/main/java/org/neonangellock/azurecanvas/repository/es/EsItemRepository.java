package org.neonangellock.azurecanvas.repository.es;

import org.neonangellock.azurecanvas.model.es.EsItem;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EsItemRepository extends ElasticsearchRepository<EsItem, String> {
}
