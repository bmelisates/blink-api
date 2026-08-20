package com.workintech.twitter_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TweetRequest {
    @NotBlank(message = "Content must not be blank")
    @Size(max = 300, message = "Content must not exceed 300 characters")
    private String content;
    private Long parentTweetId;
}
