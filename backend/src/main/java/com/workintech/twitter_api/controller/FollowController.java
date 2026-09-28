package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.dto.FollowStatsResponse;
import com.workintech.twitter_api.dto.FollowUserResponse;
import com.workintech.twitter_api.exception.ErrorResponse;
import com.workintech.twitter_api.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/users/{userId}")
@RequiredArgsConstructor
public class FollowController {
    private final FollowService followService;

    @PostMapping("/follow")
    @ResponseStatus(HttpStatus.CREATED)
    public void follow(@PathVariable Long userId, Authentication authentication) {
        validateUserId(userId);
        followService.follow(userId, authentication.getName());
    }

    @DeleteMapping("/follow")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(@PathVariable Long userId, Authentication authentication) {
        validateUserId(userId);
        followService.unfollow(userId, authentication.getName());
    }

    @GetMapping("/followers")
    public Page<FollowUserResponse> followers(@PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        validateUserId(userId);
        return followService.findFollowers(userId, pagination(page, size));
    }

    @GetMapping("/following")
    public Page<FollowUserResponse> following(@PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        validateUserId(userId);
        return followService.findFollowing(userId, pagination(page, size));
    }

    @GetMapping("/follow-stats")
    public FollowStatsResponse stats(@PathVariable Long userId, Authentication authentication) {
        validateUserId(userId);
        return followService.getStats(userId, authentication.getName());
    }

    private void validateUserId(Long userId) {
        if (userId <= 0) throw new IllegalArgumentException("User ID must be positive");
    }

    private PageRequest pagination(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Page must be non-negative and size must be between 1 and 100");
        }
        return PageRequest.of(page, size);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse invalidArgument(IllegalArgumentException exception) {
        return new ErrorResponse(400, exception.getMessage(), LocalDateTime.now());
    }
}
