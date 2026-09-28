package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.*;
import com.workintech.twitter_api.entity.*;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MessageServiceImpl implements MessageService {
    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final UserRepository users;
    private final UserService userService;

    @Override @Transactional
    public ConversationResponse open(Long recipientId, String username) {
        User actor = userService.findEntityByUsername(username);
        if (actor.getId().equals(recipientId)) throw new IllegalArgumentException("Cannot message yourself");
        User recipient = userService.findEntityById(recipientId);
        Long first = Math.min(actor.getId(), recipientId);
        Long second = Math.max(actor.getId(), recipientId);
        // Her iki taraftan eşzamanlı açılış aynı kullanıcı kilidi üzerinden sıralanır.
        users.findLockedById(first).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Conversation conversation = conversations.findByFirstUserIdAndSecondUserId(first, second).orElseGet(() -> {
            Conversation created = new Conversation();
            created.setFirstUser(actor.getId().equals(first) ? actor : recipient);
            created.setSecondUser(actor.getId().equals(first) ? recipient : actor);
            return conversations.saveAndFlush(created);
        });
        return response(conversation, actor.getId());
    }

    @Override
    public Page<ConversationResponse> conversations(String username, Pageable pageable) {
        Long viewer = userService.findEntityByUsername(username).getId();
        return conversations.findForUser(viewer, pageable).map(c -> response(c, viewer));
    }

    @Override
    public ConversationResponse conversation(Long id, String username) {
        Long viewer = userService.findEntityByUsername(username).getId();
        return response(authorized(id, viewer, false), viewer);
    }

    @Override
    public MessagePageResponse history(Long id, Long before, int size, String username) {
        Long viewer = userService.findEntityByUsername(username).getId();
        authorized(id, viewer, false);
        var page = messages.findHistory(id, before == null ? Long.MAX_VALUE : before, PageRequest.of(0, size));
        return new MessagePageResponse(page.getContent().stream().map(this::response).toList(), page.hasNext());
    }

    @Override @Transactional
    public MessageResponse send(Long id, MessageRequest request, String username) {
        User sender = userService.findEntityByUsername(username);
        Conversation conversation = authorized(id, sender.getId(), true);
        if (request.content() == null || request.content().isBlank() || request.content().length() > 2000) {
            throw new IllegalArgumentException("Message must contain between 1 and 2000 characters");
        }
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.content().strip());
        Message saved = messages.saveAndFlush(message);
        conversation.setUpdatedAt(saved.getCreatedAt());
        return response(saved);
    }

    @Override @Transactional
    public void markRead(Long id, Long through, String username) {
        Long viewer = userService.findEntityByUsername(username).getId();
        authorized(id, viewer, true);
        messages.markRead(id, viewer, through, OffsetDateTime.now());
    }

    @Override
    public long unreadCount(String username) {
        return messages.countUnread(userService.findEntityByUsername(username).getId());
    }

    private Conversation authorized(Long id, Long viewer, boolean lock) {
        Conversation c = (lock ? conversations.findLockedById(id) : conversations.findById(id))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!c.getFirstUser().getId().equals(viewer) && !c.getSecondUser().getId().equals(viewer)) {
            throw new AccessDeniedException("You are not a participant in this conversation");
        }
        return c;
    }

    private ConversationResponse response(Conversation c, Long viewer) {
        User other = c.getFirstUser().getId().equals(viewer) ? c.getSecondUser() : c.getFirstUser();
        return new ConversationResponse(c.getId(), new FollowUserResponse(other.getId(), other.getUsername()),
                messages.findFirstByConversationIdOrderByIdDesc(c.getId()).map(this::response).orElse(null),
                messages.countByConversationIdAndSenderIdNotAndReadAtIsNull(c.getId(), viewer), c.getUpdatedAt());
    }

    private MessageResponse response(Message message) {
        return new MessageResponse(message.getId(), message.getSender().getId(), message.getContent(),
                message.getCreatedAt(), message.getReadAt());
    }
}
