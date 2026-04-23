package org.neonangellock.azurecanvas.routers;

import org.springframework.web.bind.annotation.GetMapping;


public class CubeRouter {
    @GetMapping("/cube")
    public String loadCube(){
        return "app/cube/index";
    }
}
