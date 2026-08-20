package com.workintech.twitter_api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TweetResponse {
    private Long id;
    private String content;

    // Oluşturma ve update tarihleri
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Parent tweet bilgileri
    private TweetResponse parentTweet; //dataya fazladan istek atmamak için id değil response olarak aldık!!!

    // User bilgileri
    private UserResponse user; //dataya fazladan istek atmamak için id değil response olarak aldık.

    // Like, retweet, reply sayısını tutar.
    private long likeCount;
    private long retweetCount;
    private long replyCount;

    // Giriş yapan kullanıcının bu tweeti beğenip beğenmediğini kontrol eder.
    private boolean likedByCurrentUser;
    // Giriş yapan kullanıcının bu tweeti retweet edip etmediğini belirtir.
    private boolean retweetedByCurrentUser;
}
