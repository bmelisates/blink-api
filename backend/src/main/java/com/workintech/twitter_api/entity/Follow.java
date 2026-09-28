package com.workintech.twitter_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

@Entity
@Table(name = "follows",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_follows_follower_following",
                columnNames = {"follower_id", "following_id"}),
        indexes = @Index(name = "idx_follows_following", columnList = "following_id"))
@Check(constraints = "follower_id <> following_id")
@Getter
@Setter
@NoArgsConstructor
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Takip eden kullanıcı. Kullanıcı silinirse ilgili takip kayıtları da silinir.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_follows_follower"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User follower;

    // Takip edilen kullanıcı. Bu ilişki karşılıklı takip anlamına gelmez.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "following_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_follows_following"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User following;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now();
    }
}
