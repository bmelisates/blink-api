package com.workintech.twitter_api.dto;

public record FollowStatsResponse(long followerCount, long followingCount, boolean followedByCurrentUser) {
}
