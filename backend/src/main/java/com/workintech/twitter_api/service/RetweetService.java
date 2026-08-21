package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.RetweetRequest;
import com.workintech.twitter_api.dto.RetweetResponse;
import com.workintech.twitter_api.entity.Retweet;

import java.util.List;

public interface RetweetService {
    // --- Temel CRUD İşlemleri ---
    RetweetResponse findById(Long id);
    List<RetweetResponse> findAll();
    List<RetweetResponse> findByUserId(Long userId, String viewerUsername);
    List<RetweetResponse> findByTweetId(Long tweetId);
    RetweetResponse createRetweet(Long userId, RetweetRequest request);
    void deleteRetweet(Long id);

    // Sayı -> Bir tweet'in toplam retweet sayısı (Tweet detayında göstermek için)
    long countByTweetId(Long tweetId);

    // --- Doğrulama Kontrolleri ---
    boolean existsById(Long id);
    // Kullanıcı bu tweet'i önceden retweet'lemiş mi? (True/False)
    boolean existsByUserIdAndTweetId(Long userId, Long tweetId);

    // --- Entity Dönen Metot ---
    Retweet findEntityById(Long id);
}


