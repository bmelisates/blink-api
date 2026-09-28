package com.workintech.twitter_api.dto;

import java.time.OffsetDateTime;

public record ConversationResponse(Long id, FollowUserResponse participant, MessageResponse lastMessage,
                                   long unreadCount, OffsetDateTime updatedAt) { }
