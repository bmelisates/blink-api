package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.TweetRequest;
import com.workintech.twitter_api.dto.TweetResponse;
import com.workintech.twitter_api.entity.Role;
import com.workintech.twitter_api.entity.Tweet;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.repository.TweetRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.workintech.twitter_api.dto.UserResponse;
import com.workintech.twitter_api.entity.User;

import java.util.List;

@Service
public class TweetServiceImpl implements TweetService {
    private final TweetRepository tweetRepository;
    private final UserService userService;

    @Autowired
    public TweetServiceImpl(TweetRepository tweetRepository, UserService userService) {
        this.tweetRepository = tweetRepository;
        this.userService = userService;
    }

    // User'ı UserResponse' a çevirir
    private UserResponse convertToUserResponse(User user) {
        if (user == null) return null;
        UserResponse response = new UserResponse();

        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());

        return response;
    }

    // Tweet'ı TweetResponse' a çevirir
    private TweetResponse convertToResponse(Tweet tweet) {
        TweetResponse response = new TweetResponse();

        response.setId(tweet.getId());
        response.setContent(tweet.getContent());
        response.setCreatedAt(tweet.getCreatedAt());
        response.setUpdatedAt(tweet.getUpdatedAt());

        if (tweet.getUser() != null) {
            response.setUser(convertToUserResponse(tweet.getUser()));
        }

        if (tweet.getParentTweet() != null) {
            response.setParentTweet(convertToResponse(tweet.getParentTweet()));
        }

        response.setLikeCount(tweet.getLikes() != null ? tweet.getLikes().size() : 0);
        response.setRetweetCount(tweet.getRetweets() != null ? tweet.getRetweets().size() : 0);
        response.setReplyCount(tweet.getReplies() != null ? tweet.getReplies().size() : 0);

        return response;
    }

    // Id'si ile tweeti bulur, TweetResponse'a çevirir.
    @Override
    public TweetResponse findById(Long id) {
        Tweet tweet = findEntityById(id);
        return convertToResponse(tweet);
    }

    // Tüm tweetleri listeler.
    @Override
    public List<TweetResponse> findAll() {
        return tweetRepository.findAllTweetsWithUser()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // userId'ye göre tweetleri listeler.
    @Override
    public List<TweetResponse> findByUserId(Long userId) {
        return tweetRepository.findByUserIdWithUser(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // Tweet oluşturur.
    @Override
    public TweetResponse createTweet(TweetRequest request, String username) {
        // Yeni tweet oluşturur
        Tweet tweet = new Tweet();
        // Tweet contentini koyar.
        tweet.setContent(request.getContent());

        // Kullanıcıyı UserService üzerinden çekiyoruz
        User user = userService.findEntityByUsername(username);
        tweet.setUser(user);

        // Eğer başka bir tweet'e yanıt veriliyorsa (Reply)
        if (request.getParentTweetId() != null) {
            // Parent tweeti bulur
            Tweet parentTweet = findEntityById(request.getParentTweetId());
            // Parent tweeti tweet'e atar
            tweet.setParentTweet(parentTweet);
        }

        // Tweeti kaydeder
        Tweet savedTweet = tweetRepository.save(tweet);
        // Tweeti response' a çevirir
        return convertToResponse(savedTweet);
    }

    // Tweeti günceller.
    @Override
    public TweetResponse updateTweet(Long id, TweetRequest request, String username) {
        // Tweeti bulur
        Tweet existingTweet = tweetRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Tweet not found"));

        // Mevcut kullanıcının bilgilerini alır
        User currentUser = userService.findEntityByUsername(username);

        // Tweet sahibi değilse  güncelleyemez.
        if (!existingTweet.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException(
                    "You are not allowed to update this tweet");
        }
        // Tweet contentini günceller
        existingTweet.setContent(request.getContent());
        // Tweeti kaydeder
        Tweet savedTweet = tweetRepository.save(existingTweet);
        // Tweeti response' a çevirir
        return convertToResponse(savedTweet);
    }

    @Override
    public void deleteTweet(Long tweetId, String username) {

        Tweet tweet = tweetRepository.findById(tweetId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Tweet not found"));

        User currentUser = userService.findEntityByUsername(username);

        // Tweet sahibi değilse ve ADMIN değilse silemez.
        if (!tweet.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {

            throw new AccessDeniedException(
                    "You are not allowed to delete this tweet");
        }

        tweetRepository.delete(tweet);
    }

    // Keyword'ü içeren tweetleri listeler.
    @Override
    public List<TweetResponse> search(String keyword) {
        return tweetRepository.findByContentContainingIgnoreCaseOrderByCreatedAtDesc(keyword)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // Keyword'ü içeren tweetleri userId'ye göre listeler.(Sadece o kişinin tweetlerinde aramak istersek)
    @Override
    public List<TweetResponse> searchByUserId(Long userId, String keyword) {
        return tweetRepository.findByUserIdAndContentContainingIgnoreCaseOrderByCreatedAtDesc(userId, keyword)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // parentId'ye göre tweetleri listeler.
    @Override
    public List<TweetResponse> findByParentTweetId(Long parentTweetId) {
        return tweetRepository.findByParentTweetIdOrderByCreatedAtAsc(parentTweetId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // userId'ye göre tweet sayısını bulur.
    @Override
    public long countByUserId(Long userId) {
        return tweetRepository.countByUserId(userId);
    }

    // Bu id'de tweet mevcut mu?
    @Override
    public boolean existsById(Long id) {
        return tweetRepository.existsById(id);
    }

    // Bu id'de tweet varsa getirir.
    @Override
    public Tweet findEntityById(Long id) {
        return tweetRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tweet not found"));
    }

}


