package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;
@Entity
@Table(name = "user_interest")
@Getter
@Setter
public class UserInterest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user", updatable = false, nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 100)
    private String interest;

}
