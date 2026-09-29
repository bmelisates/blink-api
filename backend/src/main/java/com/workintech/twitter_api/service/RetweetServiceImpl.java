package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.RetweetRequest;
import com.workintech.twitter_api.dto.RetweetResponse;
import com.workintech.twitter_api.dto.UserResponse;
import com.workintech.twitter_api.entity.Retweet;
import com.workintech.twitter_api.entity.Tweet;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.exception.ResourceAlreadyExistsException;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.repository.RetweetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RetweetServiceImpl implements RetweetService {

    private final RetweetRepository retweetRepository;
    private final UserService userService;
    private final TweetService tweetService;

    @Autowired
    public RetweetServiceImpl(RetweetRepository retweetRepository, UserService userService, TweetService tweetService) {
        this.retweetRepository = retweetRepository;
        this.userService = userService;
        this.tweetService = tweetService;
    }

    // Entity'yi RetweetResponse DTO'suna çevirme
    private RetweetResponse convertToResponse(Retweet retweet) {
        return convertToResponse(retweet, null);
    }

    private RetweetResponse convertToResponse(Retweet retweet, String viewerUsername) {
        if (retweet == null) return null;

        RetweetResponse response = new RetweetResponse();
        response.setId(retweet.getId());

        // User Entity'sinden UserResponse DTO'suna
        if (retweet.getUser() != null) {
            UserResponse userResponse = new UserResponse(
                    retweet.getUser().getId(),
                    retweet.getUser().getUsername(),
                    null
            );
            response.setUser(userResponse);
        }

        // Tweet Entity'sinden TweetResponse DTO'suna
        if (retweet.getTweet() != null) {
            response.setTweet(tweetService.findById(retweet.getTweet().getId(), viewerUsername));
        }
        // Retweet tarihi
        response.setCreatedAt(retweet.getCreatedAt());

        return response;
    }

    @Override
    public RetweetResponse findById(Long id) {
        Retweet retweet = findEntityById(id);
        return convertToResponse(retweet);
    }

    @Override
    public List<RetweetResponse> findAll() {
        return retweetRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public List<RetweetResponse> findByTweetId(Long tweetId) {
        return retweetRepository.findByTweetId(tweetId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Override
    public List<RetweetResponse> findByUserId(Long userId, String viewerUsername) {
        return retweetRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(retweet -> convertToResponse(retweet, viewerUsername))
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public RetweetResponse createRetweet(Long userId, RetweetRequest request) {
        // Serialize duplicate checks with other mutations of this post.
        Tweet tweet = tweetService.findActiveEntityById(request.getTweetId());
        // 1. İş Kuralı: Kullanıcı aynı tweet'i önceden retweet etmiş mi?
        if (existsByUserIdAndTweetId(userId, request.getTweetId())) {
            throw new ResourceAlreadyExistsException("You have already retweeted this tweet");
        }

        // 2. Diğer servisler üzerinden Entity'leri bulma
        User user = userService.findEntityById(userId);

        Retweet retweet = new Retweet();
        retweet.setUser(user);
        retweet.setTweet(tweet);

        Retweet savedRetweet = retweetRepository.save(retweet);
        return convertToResponse(savedRetweet);
    }

    @Override
    public void deleteRetweet(Long id) {
        Retweet retweet = findEntityById(id);
        retweetRepository.delete(retweet);
    }

    @Override
    public long countByTweetId(Long tweetId) {
        return retweetRepository.countByTweetId(tweetId);
    }

    @Override
    public boolean existsById(Long id) {
        return retweetRepository.existsById(id);
    }

    @Override
    public boolean existsByUserIdAndTweetId(Long userId, Long tweetId) {
        return retweetRepository.existsByUserIdAndTweetId(userId, tweetId);
    }

    @Override
    public Retweet findEntityById(Long id) {
        return retweetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retweet not found with id: " + id));
    }


}
