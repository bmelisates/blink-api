package com.workintech.twitter_api.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "tweets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tweet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Content must not be blank")
    @Size(max = 300, message = "Content must not exceed 300 characters")
    @Column(length = 300, nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    //LIFECYCLE CALLBACKS
    // Tweet veritabanına ilk kaydedilmeden hemen önce otomatik tarih atar
    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now();
    }

    // Tweet güncellendiğinde otomatik güncelleme tarihi atar
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    // Tweetin sahibi (User ilişkisi)
    @ManyToOne // Birden fazla Tweet aynı User'a ait olabilir; her Tweet tek bir User'a aittir.
    @JoinColumn(name = "user_id", nullable = false) // tweets tablosuna user_id adında bir Foreign Key sütunu ekler.
    private User user;

    // Tweeti kimler beğendi (Like ilişkisi)
    @OneToMany(mappedBy = "tweet", cascade = CascadeType.ALL, orphanRemoval = true)
    // OneToMany -> Bir tweetin birçok like'ı olabilir. Bir like sadece bir tweet'e ait olabilir.
    // mappedBy = tweet -> İlişkinin sahibi Like sınıfındaki tweet alanı.
    // CascadeType.ALL -> tweet silinirse ona ait likelar da silinsin.
    // orphanRemoval -> tweet'ın likes kümesinden bir like kaldırılırsa o like veritabanından da silinir
    private Set<Like> likes = new HashSet<>(); //İçi boş hazır küme. NullPointerException almamak için.

    // Tweeti kimler retweet etti (Retweet ilişkisi)
    @OneToMany(mappedBy = "tweet", cascade = CascadeType.ALL, orphanRemoval = true)
    //tweet silinirse ona ait retweetler de silinsin.
    private Set<Retweet> retweets = new HashSet<>();

    // Reply'ın bağlı olduğu parent tweet
    @ManyToOne
    @JoinColumn(name = "parent_tweet_id")
    private Tweet parentTweet;

    // Parent tweet'in reply'ları
    @OneToMany(mappedBy = "parentTweet")
    private Set<Tweet> replies = new HashSet<>();

}
