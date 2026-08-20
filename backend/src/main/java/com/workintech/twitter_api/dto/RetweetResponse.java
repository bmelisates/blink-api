package com.workintech.twitter_api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RetweetResponse {
    private Long id;
    private UserResponse user;
    private TweetResponse tweet;
    private OffsetDateTime createdAt;
}
