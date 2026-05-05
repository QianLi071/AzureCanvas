package org.neonangellock.azurecanvas.service;

import com.alibaba.fastjson2.JSONObject;
import org.neonangellock.azurecanvas.request.ChatCompletionRequest;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;

public interface ChatService {
    Flux<ServerSentEvent<JSONObject>> completions(ChatCompletionRequest chatCompletionRequest);
}
