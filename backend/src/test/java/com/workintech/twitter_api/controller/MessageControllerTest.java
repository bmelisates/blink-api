package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.config.SecurityConfig;
import com.workintech.twitter_api.dto.MessageRequest;
import com.workintech.twitter_api.security.*;
import com.workintech.twitter_api.service.MessageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MessageController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class MessageControllerTest {
    @Autowired MockMvc mvc;
    @MockBean MessageService service;
    @MockBean JwtService jwtService;
    @MockBean CustomUserDetailsService userDetailsService;

    @Test void requiresLoginForAllOperations() throws Exception {
        mvc.perform(get("/conversations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/conversations/1/messages")).andExpect(status().isUnauthorized());
        mvc.perform(get("/conversations/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/conversations/unread-count")).andExpect(status().isUnauthorized());
        mvc.perform(post("/conversations/with/2")).andExpect(status().isUnauthorized());
        mvc.perform(post("/conversations/1/messages")).andExpect(status().isUnauthorized());
        mvc.perform(put("/conversations/1/read?through=2")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test void senderComesFromAuthentication() throws Exception {
        mvc.perform(post("/conversations/1/messages").with(user("alice"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"hello\",\"senderId\":999}"))
                .andExpect(status().isCreated());
        verify(service).send(1L, new MessageRequest("hello"), "alice");
    }

    @ParameterizedTest @ValueSource(strings = {"", "   "})
    void rejectsEmptyMessages(String content) throws Exception {
        mvc.perform(post("/conversations/1/messages").with(user("alice"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"" + content + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test void rejectsOversizeMessage() throws Exception {
        mvc.perform(post("/conversations/1/messages").with(user("alice"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"" + "x".repeat(2001) + "\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test void forbiddenConversationReturns403() throws Exception {
        when(service.history(1L, null, 30, "eve")).thenThrow(new AccessDeniedException("Not a participant"));
        mvc.perform(get("/conversations/1/messages").with(user("eve"))).andExpect(status().isForbidden());
    }

    @ParameterizedTest @ValueSource(strings = {"/conversations?page=-1", "/conversations?size=101", "/conversations/1/messages?before=0", "/conversations/0", "/conversations/1/messages?size=0"})
    void rejectsInvalidBounds(String path) throws Exception {
        mvc.perform(get(path).with(user("alice"))).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
