package com.workintech.twitter_api.dto;

import java.util.List;

public record MessagePageResponse(List<MessageResponse> content, boolean hasMore) { }
