package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.LikeRequest;
import com.workintech.twitter_api.dto.LikeResponse;
import com.workintech.twitter_api.dto.TweetResponse;
import com.workintech.twitter_api.dto.UserResponse;
import com.workintech.twitter_api.entity.Like;
import com.workintech.twitter_api.entity.Tweet;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.exception.ResourceAlreadyExistsException;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.repository.LikeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LikeServiceImpl implements LikeService {

    private final LikeRepository likeRepository;
    private final UserService userService;
    private final TweetService tweetService;

    @Autowired
    public LikeServiceImpl(LikeRepository likeRepository, UserService userService, TweetService tweetService) {
        this.likeRepository = likeRepository;
        this.userService = userService;
        this.tweetService = tweetService;
    }

    private LikeResponse convertToResponse(Like like) {
        if (like == null) return null;

        LikeResponse response = new LikeResponse();
        response.setId(like.getId());

        // User Entity'sinden UserResponse DTO'suna
        if (like.getUser() != null) {
            UserResponse userResponse = new UserResponse(
                    like.getUser().getId(),
                    like.getUser().getUsername(),
                    null
            );
            response.setUser(userResponse);
        }

        if (like.getTweet() != null) {
            TweetResponse tweetResponse = new TweetResponse();
            tweetResponse.setId(like.getTweet().getId());
            tweetResponse.setContent(like.getTweet().getContent());
            tweetResponse.setCreatedAt(like.getTweet().getCreatedAt());
            tweetResponse.setUpdatedAt(like.getTweet().getUpdatedAt());

            // Tweet'i atan kullanıcı bilgisi
            if (like.getTweet().getUser() != null) {
                tweetResponse.setUser(new UserResponse(
                        like.getTweet().getUser().getId(),
                        like.getTweet().getUser().getUsername(),
                        null
                ));
            }

            response.setTweet(tweetResponse);
        }

        return response;
    }

    @Override
    public LikeResponse findById(Long id) {
        Like like = findEntityById(id);
        return convertToResponse(like);
    }

    @Override
    public List<LikeResponse> findAll() {
        return likeRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public List<LikeResponse> findByUserId(Long userId) {
        return likeRepository.findByUserId(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public List<LikeResponse> findByTweetId(Long tweetId) {
        return likeRepository.findByTweetId(tweetId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public LikeResponse createLike(Long userId, LikeRequest request) {
        // Serialize duplicate checks with other mutations of this post.
        Tweet tweet = tweetService.findActiveEntityById(request.getTweetId());
        // 1. İş Kuralı: Kullanıcı aynı tweet'i önceden likelamış mı?
        if (existsByUserIdAndTweetId(userId, request.getTweetId())) {
            throw new ResourceAlreadyExistsException("You have already liked this tweet");
        }

        // 2. Diğer servisler üzerinden Entity'leri bulma
        User user = userService.findEntityById(userId);

        Like like = new Like();
        like.setUser(user);
        like.setTweet(tweet);

        Like savedLike = likeRepository.save(like);
        return convertToResponse(savedLike);
    }

    @Override
    public void deleteLike(Long id) {
        Like like = findEntityById(id);
        likeRepository.delete(like);
    }

    @Override
    public void deleteLikeByUserIdAndTweetId(Long userId, Long tweetId) {
        likeRepository.findByUserIdAndTweetId(userId, tweetId).ifPresent(like -> {
            likeRepository.delete(like);
        });
    }

    @Override
    public long countByTweetId(Long tweetId) {
        return likeRepository.countByTweetId(tweetId);
    }

    @Override
    public boolean existsById(Long id) {
        return likeRepository.existsById(id);
    }

    @Override
    public boolean existsByUserIdAndTweetId(Long userId, Long tweetId) {
        return likeRepository.existsByUserIdAndTweetId(userId, tweetId);
    }

    @Override
    public Like findEntityById(Long id) {
        return likeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Like not found with id: " + id));
    }
}
