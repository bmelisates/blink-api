package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.Retweet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RetweetRepository extends JpaRepository<Retweet, Long> {

    // Belirli bir kullanıcının retweet'lerini getirir
    List<Retweet> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Belirli bir tweetin retweet'lerini getirir
    List<Retweet> findByTweetId(Long tweetId);

    // Kullanıcının bu tweet'i retweet edip etmediğini bulur (Retweeti geri çekmek için)
    Optional<Retweet> findByUserIdAndTweetId(Long userId, Long tweetId);

    // Tweet'in toplam retweet sayısını getirir
    long countByTweetId(Long tweetId);

    // Kullanıcının bu tweet'i retweet edip etmediğini boolean döner (UI kontrolleri için)
    boolean existsByUserIdAndTweetId(Long userId, Long tweetId);
}
