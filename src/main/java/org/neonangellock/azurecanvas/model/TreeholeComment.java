package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Setter
@Getter
@Entity
@Table(name = "treehole_comments")
public class TreeholeComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String authorName;

    private String authorAvatar;

    private boolean isRobotComment = false;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private TreeholePost post;

    @ManyToOne
    @JoinColumn(name = "robot_id")
    private RobotConfig robot;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt = new Date();

}
