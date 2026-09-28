package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MessageService {
    ConversationResponse open(Long recipientId, String username);
    Page<ConversationResponse> conversations(String username, Pageable pageable);
    ConversationResponse conversation(Long id, String username);
    MessagePageResponse history(Long id, Long before, int size, String username);
    MessageResponse send(Long id, MessageRequest request, String username);
    void markRead(Long id, Long through, String username);
    long unreadCount(String username);
}
