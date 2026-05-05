package org.neonangellock.azurecanvas.util;

import com.alibaba.fastjson2.JSONObject;
import org.neonangellock.azurecanvas.request.ChatCompletionRequest;

public class ModelMessageUtils {
    public static JSONObject convertModelChatResponse(String id, String content) {
        JSONObject jsonObject = new JSONObject();
        if ( !(id).isBlank() && !(content).isBlank() ) {
            jsonObject.put("id", id);
            jsonObject.put("content", content);
            return jsonObject;
        }
        return jsonObject;
    }

}