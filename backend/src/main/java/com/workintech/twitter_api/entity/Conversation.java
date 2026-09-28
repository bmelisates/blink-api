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
@Table(name = "conversations", uniqueConstraints = @UniqueConstraint(
        name = "uk_conversation_pair", columnNames = {"first_user_id", "second_user_id"}),
        indexes = {@Index(name = "idx_conversation_first", columnList = "first_user_id,updated_at"),
                @Index(name = "idx_conversation_second", columnList = "second_user_id,updated_at")})
@Check(constraints = "first_user_id < second_user_id")
@Getter @Setter @NoArgsConstructor
public class Conversation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Küçük ID her zaman ilk tarafta: aynı iki kişi için tek konuşma.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "first_user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User firstUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "second_user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User secondUser;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    public void initialize() { updatedAt = OffsetDateTime.now(); }
}
