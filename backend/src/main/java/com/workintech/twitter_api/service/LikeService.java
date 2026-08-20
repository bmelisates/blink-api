package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.LikeRequest;
import com.workintech.twitter_api.dto.LikeResponse;
import com.workintech.twitter_api.entity.Like;

import java.util.List;

public interface LikeService {
    // --- Temel CRUD İşlemleri ---
    LikeResponse findById(Long id);
    List<LikeResponse> findAll();
    List<LikeResponse> findByUserId(Long userId);
    List<LikeResponse> findByTweetId(Long tweetId);
    LikeResponse createLike(Long userId, LikeRequest request);
    void deleteLike(Long id);
    void deleteLikeByUserIdAndTweetId(Long userId, Long tweetId);

    // Sayı
    // Bir tweet'in toplam beğeni sayısı (Tweet detayında göstermek için)
    long countByTweetId(Long tweetId);

    // --- Doğrulama Kontrolleri ---
    boolean existsById(Long id);
    // Kullanıcı bu tweet'i önceden beğenmiş mi? (True/False)
    boolean existsByUserIdAndTweetId(Long userId, Long tweetId);

    // --- Diğer Metodlar ---
    Like findEntityById(Long id);
}
