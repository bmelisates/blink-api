package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.dto.RetweetRequest;
import com.workintech.twitter_api.dto.RetweetResponse;
import com.workintech.twitter_api.entity.Retweet;
import com.workintech.twitter_api.service.RetweetService;
import com.workintech.twitter_api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/retweets")
public class RetweetController {

    private final RetweetService retweetService;
    private final UserService userService;

    @Autowired
    public RetweetController(RetweetService retweetService, UserService userService) {
        this.retweetService = retweetService;
        this.userService = userService;
    }

    @GetMapping
    public List<RetweetResponse> findAll() {
        return retweetService.findAll();
    }

    @GetMapping("/{id}")
    public RetweetResponse findById(@PathVariable Long id) {
        return retweetService.findById(id);
    }

    @GetMapping("/user/{userId}")
    public List<RetweetResponse> findByUserId(@PathVariable Long userId) {
        return retweetService.findByUserId(userId);
    }

    @GetMapping("/tweet/{tweetId}")
    public List<RetweetResponse> findByTweetId(@PathVariable Long tweetId) {
        return retweetService.findByTweetId(tweetId);
    }

    @GetMapping("/tweet/{tweetId}/count")
    public long countByTweetId(@PathVariable Long tweetId) {
        return retweetService.countByTweetId(tweetId);
    }

    @GetMapping("/check")
    public boolean existsByUserIdAndTweetId(@RequestParam Long userId, @RequestParam Long tweetId) {
        return retweetService.existsByUserIdAndTweetId(userId, tweetId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RetweetResponse createRetweet(@Valid @RequestBody RetweetRequest request, org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();
        Long userId = userService.findEntityByUsername(username).getId();
        return retweetService.createRetweet(userId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRetweet(@PathVariable Long id, Authentication authentication) {
        Retweet retweet = retweetService.findEntityById(id);
        Long currentUserId = userService.findEntityByUsername(authentication.getName()).getId();
        
        // Sadece kendi retweet'ini silebilir
        if (!retweet.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only delete your own retweets");
        }
        
        retweetService.deleteRetweet(id);
    }
}