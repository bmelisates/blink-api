package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.dto.TweetRequest;
import com.workintech.twitter_api.dto.TweetResponse;
import com.workintech.twitter_api.service.TweetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tweets")
public class TweetController {

    private final TweetService tweetService;

    @Autowired
    public TweetController(TweetService tweetService) {
        this.tweetService = tweetService;
    }

    @GetMapping
    public List<TweetResponse> findAll() {
        return tweetService.findAll();
    }

    @GetMapping("/{id}")
    public TweetResponse findById(@PathVariable Long id) {
        return tweetService.findById(id);
    }

    @GetMapping("/user/{userId}")
    public List<TweetResponse> findByUserId(@PathVariable Long userId) {
        return tweetService.findByUserId(userId);
    }

    @GetMapping("/search")
    public List<TweetResponse> findByContentContaining(@RequestParam String keyword) {
        return tweetService.search(keyword);
    }

    @GetMapping("/user/{userId}/search")
    public List<TweetResponse> findByUserIdAndContentContaining(@PathVariable Long userId, @RequestParam String keyword) {
        return tweetService.searchByUserId(userId, keyword);
    }

    @GetMapping("/{id}/replies")
    public List<TweetResponse> findByParentTweetId(@PathVariable Long id) {
        return tweetService.findByParentTweetId(id);
    }

    @GetMapping("/user/{userId}/count")
    public long countByUserId(@PathVariable Long userId) {
        return tweetService.countByUserId(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TweetResponse createTweet(@Valid @RequestBody TweetRequest request, Authentication authentication) {
        return tweetService.createTweet(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public TweetResponse updateTweet(
            @PathVariable Long id,
            @Valid @RequestBody TweetRequest request,
            Authentication authentication) {

        return tweetService.updateTweet(
                id,
                request,
                authentication.getName()
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTweet(
            @PathVariable Long id,
            Authentication authentication) {

        tweetService.deleteTweet(
                id,
                authentication.getName()
        );
    }
}