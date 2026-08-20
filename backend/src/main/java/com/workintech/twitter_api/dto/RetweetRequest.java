package com.workintech.twitter_api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RetweetRequest {
    @NotNull(message = "Tweet ID must not be null")
    private Long tweetId;
}
