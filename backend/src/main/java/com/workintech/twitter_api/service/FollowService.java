package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.FollowStatsResponse;
import com.workintech.twitter_api.dto.FollowUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FollowService {
    void follow(Long followingId, String currentUsername);
    void unfollow(Long followingId, String currentUsername);
    Page<FollowUserResponse> findFollowers(Long userId, Pageable pageable);
    Page<FollowUserResponse> findFollowing(Long userId, Pageable pageable);
    FollowStatsResponse getStats(Long userId, String currentUsername);
}
