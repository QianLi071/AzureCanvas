package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    User findByUsername(String username);

    User findByEmail(String email);
}