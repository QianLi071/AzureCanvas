package org.neonangellock.azurecanvas.controller;

import com.alibaba.fastjson2.JSONObject;
import lombok.RequiredArgsConstructor;
import org.neonangellock.azurecanvas.request.ChatCompletionRequest;
import org.neonangellock.azurecanvas.service.ChatService;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/chat")
public class ChatController {
    private final ChatService chatCompletionService;

    @PostMapping(value = "/completions")
    public Flux<ServerSentEvent<JSONObject>> completions(@RequestBody ChatCompletionRequest chatCompletionRequest) {
        return chatCompletionService.completions(chatCompletionRequest);
    }
}
