package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.dto.*;
import com.workintech.twitter_api.exception.ErrorResponse;
import com.workintech.twitter_api.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService service;

    @PostMapping("/with/{userId}")
    public ConversationResponse open(@PathVariable Long userId, Authentication auth) {
        positive(userId);
        return service.open(userId, auth.getName());
    }

    @GetMapping
    public Page<ConversationResponse> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, Authentication auth) {
        if (page < 0) throw new IllegalArgumentException("Invalid page");
        size(size);
        return service.conversations(auth.getName(), PageRequest.of(page, size));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread(Authentication auth) { return Map.of("count", service.unreadCount(auth.getName())); }

    @GetMapping("/{id}")
    public ConversationResponse details(@PathVariable Long id, Authentication auth) {
        positive(id);
        return service.conversation(id, auth.getName());
    }

    @GetMapping("/{id}/messages")
    public MessagePageResponse history(@PathVariable Long id, @RequestParam(required = false) Long before,
            @RequestParam(defaultValue = "30") int size, Authentication auth) {
        positive(id);
        if (before != null) positive(before);
        size(size);
        return service.history(id, before, size, auth.getName());
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse send(@PathVariable Long id, @Valid @RequestBody MessageRequest request, Authentication auth) {
        positive(id);
        return service.send(id, request, auth.getName());
    }

    @PutMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@PathVariable Long id, @RequestParam Long through, Authentication auth) {
        positive(id);
        positive(through);
        service.markRead(id, through, auth.getName());
    }

    private void positive(Long id) {
        if (id <= 0) throw new IllegalArgumentException("ID must be positive");
    }

    private void size(int size) {
        if (size < 1 || size > 100) throw new IllegalArgumentException("Size must be between 1 and 100");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse invalid(IllegalArgumentException ex) { return new ErrorResponse(400, ex.getMessage(), LocalDateTime.now()); }
}
