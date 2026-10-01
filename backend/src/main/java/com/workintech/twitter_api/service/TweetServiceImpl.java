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
import java.util.Comparator;
import java.util.stream.Stream;

@Service
@org.springframework.transaction.annotation.Transactional(readOnly = true)
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

        return response;
    }

    // Tweet'ı TweetResponse' a çevirir
    private TweetResponse convertToResponse(Tweet tweet, String viewerUsername) {
        TweetResponse response = new TweetResponse();

        response.setId(tweet.getId());
        response.setDeleted(tweet.isDeleted());
        response.setContent(tweet.isDeleted() ? null : tweet.getContent());
        response.setCreatedAt(tweet.getCreatedAt());
        response.setUpdatedAt(tweet.getUpdatedAt());

        if (!tweet.isDeleted() && tweet.getUser() != null) {
            response.setUser(convertToUserResponse(tweet.getUser()));
        }

        Tweet parent = tweet.getParentTweet();
        // Silinen yanıtları atla; silinen ana gönderi konuşmanın yer tutucusu olarak kalır.
        while (parent != null && parent.isDeleted() && parent.getParentTweet() != null) {
            parent = parent.getParentTweet();
        }
        if (parent != null) {
            response.setParentTweet(convertToResponse(parent, viewerUsername));
        }

        response.setLikeCount(tweet.getLikes() != null ? tweet.getLikes().size() : 0);
        response.setRetweetCount(tweet.getRetweets() != null ? tweet.getRetweets().size() : 0);
        response.setReplyCount(visibleReplies(tweet).count());
        response.setLikedByCurrentUser(viewerUsername != null && tweet.getLikes().stream()
                .anyMatch(like -> viewerUsername.equals(like.getUser().getUsername())));
        response.setRetweetedByCurrentUser(viewerUsername != null && tweet.getRetweets().stream()
                .anyMatch(retweet -> viewerUsername.equals(retweet.getUser().getUsername())));

        return response;
    }

    // Id'si ile tweeti bulur, TweetResponse'a çevirir.
    @Override
    public TweetResponse findById(Long id, String viewerUsername) {
        Tweet tweet = findEntityById(id);
        return convertToResponse(tweet, viewerUsername);
    }

    // Tüm tweetleri listeler.
    @Override
    public List<TweetResponse> findAll(String viewerUsername) {
        return tweetRepository.findAllTweetsWithUser()
                .stream()
                .map(tweet -> convertToResponse(tweet, viewerUsername))
                .toList();
    }

    // userId'ye göre tweetleri listeler.
    @Override
    public List<TweetResponse> findByUserId(Long userId, String viewerUsername) {
        return tweetRepository.findByUserIdWithUser(userId)
                .stream()
                .map(tweet -> convertToResponse(tweet, viewerUsername))
                .toList();
    }

    // Tweet oluşturur.
    @Override
    @org.springframework.transaction.annotation.Transactional
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
            Tweet parentTweet = findActiveEntityById(request.getParentTweetId());
            // Parent tweeti tweet'e atar
            tweet.setParentTweet(parentTweet);
        }

        // Tweeti kaydeder
        Tweet savedTweet = tweetRepository.save(tweet);
        // Tweeti response' a çevirir
        return convertToResponse(savedTweet, username);
    }

    // Tweeti günceller.
    @Override
    @org.springframework.transaction.annotation.Transactional
    public TweetResponse updateTweet(Long id, TweetRequest request, String username) {
        // Tweeti bulur
        Tweet existingTweet = tweetRepository.findLockedById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Tweet not found"));

        // Mevcut kullanıcının bilgilerini alır
        if (existingTweet.isDeleted()) throw new ResourceNotFoundException("Tweet has been deleted");
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
        return convertToResponse(savedTweet, username);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void deleteTweet(Long tweetId, String username) {

        Tweet tweet = tweetRepository.findLockedById(tweetId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Tweet not found"));

        User currentUser = userService.findEntityByUsername(username);

        // Tweet sahibi değilse ve ADMIN değilse silemez.
        if (!tweet.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {

            throw new AccessDeniedException(
                    "You are not allowed to delete this tweet");
        }

        if (tweet.isDeleted()) return;
        // İçeriği kaldır, ilişkiyi koru: yanıtlar aynı parent ID'sini kullanmaya devam eder.
        tweet.setContent("[deleted]");
        tweet.setDeleted(true);
        tweet.getLikes().clear();
        tweet.getRetweets().clear();
        tweetRepository.saveAndFlush(tweet);
    }

    // Keyword'ü içeren tweetleri listeler.
    @Override
    public List<TweetResponse> search(String keyword, String viewerUsername) {
        return tweetRepository.findByDeletedFalseAndContentContainingIgnoreCaseOrderByCreatedAtDesc(keyword)
                .stream()
                .map(tweet -> convertToResponse(tweet, viewerUsername))
                .toList();
    }

    // Keyword'ü içeren tweetleri userId'ye göre listeler.(Sadece o kişinin tweetlerinde aramak istersek)
    @Override
    public List<TweetResponse> searchByUserId(Long userId, String keyword, String viewerUsername) {
        return tweetRepository.findByUserIdAndDeletedFalseAndContentContainingIgnoreCaseOrderByCreatedAtDesc(userId, keyword)
                .stream()
                .map(tweet -> convertToResponse(tweet, viewerUsername))
                .toList();
    }

    // parentId'ye göre tweetleri listeler.
    @Override
    public List<TweetResponse> findByParentTweetId(Long parentTweetId, String viewerUsername) {
        return tweetRepository.findByParentTweetIdOrderByCreatedAtAsc(parentTweetId)
                .stream()
                .flatMap(this::visibleReply)
                .sorted(Comparator.comparing(Tweet::getCreatedAt).thenComparing(Tweet::getId))
                .map(tweet -> convertToResponse(tweet, viewerUsername))
                .toList();
    }

    private Stream<Tweet> visibleReplies(Tweet tweet) {
        return tweet.getReplies().stream().flatMap(this::visibleReply);
    }

    private Stream<Tweet> visibleReply(Tweet reply) {
        return reply.isDeleted() ? visibleReplies(reply) : Stream.of(reply);
    }

    // userId'ye göre tweet sayısını bulur.
    @Override
    public long countByUserId(Long userId) {
        return tweetRepository.countByUserIdAndDeletedFalse(userId);
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

    @Override
    @org.springframework.transaction.annotation.Transactional
    public Tweet findActiveEntityById(Long id) {
        Tweet tweet = tweetRepository.findLockedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tweet not found"));
        if (tweet.isDeleted()) throw new ResourceNotFoundException("Tweet has been deleted");
        return tweet;
    }

}


