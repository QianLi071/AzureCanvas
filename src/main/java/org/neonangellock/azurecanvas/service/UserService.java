package org.neonangellock.azurecanvas.service;

import org.neonangellock.azurecanvas.model.User;
import java.util.UUID;

public interface UserService {
    User findById(UUID id);
    User findByUsername(String username);
    User findByEmail(String email);
    User save(User user);
    User register(User user, String password);
    User login(String username, String password);
}