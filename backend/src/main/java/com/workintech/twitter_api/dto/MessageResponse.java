package com.workintech.twitter_api.dto;

import java.time.OffsetDateTime;

public record MessageResponse(Long id, Long senderId, String content, OffsetDateTime createdAt, OffsetDateTime readAt) { }
