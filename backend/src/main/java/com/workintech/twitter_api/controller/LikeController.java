package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.dto.LikeRequest;
import com.workintech.twitter_api.dto.LikeResponse;
import com.workintech.twitter_api.entity.Like;
import com.workintech.twitter_api.service.LikeService;
import com.workintech.twitter_api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/likes")
public class LikeController {

    private final LikeService likeService;
    private final UserService userService;

    @Autowired
    public LikeController(LikeService likeService, UserService userService) {
        this.likeService = likeService;
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public LikeResponse findById(@PathVariable Long id) {
        return likeService.findById(id);
    }

    @GetMapping
    public List<LikeResponse> findAll() {
        return likeService.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<LikeResponse> findByUserId(@PathVariable Long userId) {
        return likeService.findByUserId(userId);
    }

    @GetMapping("/tweet/{tweetId}")
    public List<LikeResponse> findByTweetId(@PathVariable Long tweetId) {
        return likeService.findByTweetId(tweetId);
    }

    // 🌟 YENİ: Bir tweet'in toplam beğeni sayısını döner
    @GetMapping("/tweet/{tweetId}/count")
    public long countByTweetId(@PathVariable Long tweetId) {
        return likeService.countByTweetId(tweetId);
    }

    // 🌟 YENİ: Kullanıcının tweet'i beğenip beğenmediğini kontrol eder
    @GetMapping("/check")
    public boolean existsByUserIdAndTweetId(@RequestParam Long userId, @RequestParam Long tweetId) {
        return likeService.existsByUserIdAndTweetId(userId, tweetId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LikeResponse createLike(@Valid @RequestBody LikeRequest request, org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();
        Long userId = userService.findEntityByUsername(username).getId();
        return likeService.createLike(userId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLike(@PathVariable Long id, Authentication authentication) {
        Like like = likeService.findEntityById(id);
        Long currentUserId = userService.findEntityByUsername(authentication.getName()).getId();

        // Sadece kendi like'ını silebilir
        if (!like.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only delete your own likes");
        }

        likeService.deleteLike(id);
    }

    @DeleteMapping("/tweet/{tweetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLikeByTweetId(@PathVariable Long tweetId, Authentication authentication) {
        Long currentUserId = userService.findEntityByUsername(authentication.getName()).getId();
        likeService.deleteLikeByUserIdAndTweetId(currentUserId, tweetId);
    }
}