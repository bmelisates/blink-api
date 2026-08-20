package com.workintech.twitter_api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "retweets",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_retweets_user_tweet", columnNames = {"user_id", "tweet_id"})
        } // Bir kullanıcının aynı tweet'i birden fazla kez retweet etmesini engeller.
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Retweet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now();
    } //Tarih otomatik atanır.

    // Retweeti yapan user
    @ManyToOne(fetch = FetchType.LAZY) //Lazy -> İlişkili veriyi hemen getirme, ihtiyaç duyulduğunda getir.
    //Örn: JPA'nın işi aslında sadece Retweet'i getirmekse, User'ı da hemen bütün detaylarıyla çekmek zorunda kalmasın.
    @JoinColumn(name = "user_id", nullable = false) //retweets tablosuna user_id(fk) sütununu ekler.
    private User user;

    // Retweet edilen tweet
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tweet_id", nullable = false) //retweets tablosuna tweet_id(fk) sütununu ekler.
    private Tweet tweet;

}
