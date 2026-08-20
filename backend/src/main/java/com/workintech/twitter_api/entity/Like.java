package com.workintech.twitter_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "likes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_likes_user_tweet", columnNames = {"user_id", "tweet_id"})
        } // Bir kullanıcının aynı tweet'i birden fazla kez beğenmesini engeller.
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Like {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Beğeniyi yapan kullanıcı
    @ManyToOne(fetch = FetchType.LAZY)
    // İlişkili veriyi hemen getirme, ihtiyaç duyulduğunda getir. Gereksiz SQL yükünden kaçınıyoruz.
    @JoinColumn(name = "user_id", nullable = false) // likes tablosuna user_id sütununu(fk) ekler.
    private User user;

    // Beğenilen tweet
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tweet_id", nullable = false) // likes tablosuna tweet_id sütununu(fk) ekler.
    private Tweet tweet;
}
