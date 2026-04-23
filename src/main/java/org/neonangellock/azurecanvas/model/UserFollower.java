package org.neonangellock.azurecanvas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_followers")
@Getter @Setter
public class UserFollower {

    @EmbeddedId
    private UserFollowerId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("followerId")
    @JoinColumn(name = "followerId")
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("followingId")
    @JoinColumn(name = "followingId")
    private User following;

    @CreationTimestamp
    @Column(name = "followedAt", nullable = false, updatable = false)
    private OffsetDateTime followedAt;

    @Embeddable
    @Getter @Setter
    public static class UserFollowerId implements Serializable {
        private UUID followerId;
        private UUID followingId;

        public UserFollowerId() {}
        public UserFollowerId(UUID followerId, UUID followingId) {
            this.followerId = followerId;
            this.followingId = followingId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            UserFollowerId that = (UserFollowerId) o;
            return followerId.equals(that.followerId) && followingId.equals(that.followingId);
        }

        @Override
        public int hashCode() {
            return 31 * followerId.hashCode() + followingId.hashCode();
        }
    }
}