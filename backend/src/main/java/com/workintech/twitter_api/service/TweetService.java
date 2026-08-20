package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.TweetRequest;
import com.workintech.twitter_api.dto.TweetResponse;
import com.workintech.twitter_api.entity.Tweet;

import java.util.List;

public interface TweetService {
    // --- Temel CRUD İşlemleri ---
    TweetResponse findById(Long id);
    List<TweetResponse> findAll();
    List<TweetResponse> findByUserId(Long userId);
    TweetResponse createTweet(TweetRequest request, String username);
    TweetResponse updateTweet(Long id, TweetRequest request, String username);
    void deleteTweet(Long tweetId, String username);

    // --- Arama ve Sorgulama Metotları ---
    List<TweetResponse> search(String keyword);
    List<TweetResponse> searchByUserId(Long userId, String keyword);

    // Reply
    List<TweetResponse> findByParentTweetId(Long parentTweetId);

    // Sayılar
    long countByUserId(Long userId);

    // --- Doğrulama Kontrolleri ---
    boolean existsById(Long id);

    // --- Entity Dönen Metot (Diğer Servislerin İç Kullanımı İçin) ---
    Tweet findEntityById(Long id);
}
