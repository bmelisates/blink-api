package com.workintech.twitter_api.dto;

// Takip listelerinde e-posta ve şifre gibi özel bilgiler gönderilmez.
public record FollowUserResponse(Long id, String username) {
}
