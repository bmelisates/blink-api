package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.config.SecurityConfig;
import com.workintech.twitter_api.dto.FollowStatsResponse;
import com.workintech.twitter_api.dto.FollowUserResponse;
import com.workintech.twitter_api.exception.ResourceAlreadyExistsException;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.security.*;
import com.workintech.twitter_api.service.FollowService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FollowController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class FollowControllerTest {
    @Autowired MockMvc mvc;
    @MockBean FollowService service;
    @MockBean JwtService jwtService;
    @MockBean CustomUserDetailsService userDetailsService;

    @Test
    void anonymousRequestsRequireAuthentication() throws Exception {
        mvc.perform(post("/users/2/follow")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("statusCode").value(401));
        mvc.perform(delete("/users/2/follow")).andExpect(status().isUnauthorized());
        for (String path : List.of("followers", "following", "follow-stats")) {
            mvc.perform(get("/users/2/" + path)).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(service);
    }

    @Test
    void mutationsUseAuthenticatedIdentityInsteadOfClientSuppliedIdentity() throws Exception {
        mvc.perform(post("/users/2/follow").with(user("melis"))
                .param("followerId", "999")).andExpect(status().isCreated());
        verify(service).follow(2L, "melis");
        mvc.perform(delete("/users/2/follow").with(user("melis")))
                .andExpect(status().isNoContent());
        verify(service).unfollow(2L, "melis");
    }

    @Test
    void listsReturnPagedPublicUserDetails() throws Exception {
        var pageable = PageRequest.of(0, 20);
        var page = new PageImpl<>(List.of(new FollowUserResponse(1L, "melis")), pageable, 1);
        when(service.findFollowers(2L, pageable)).thenReturn(page);
        when(service.findFollowing(2L, pageable)).thenReturn(page);
        for (String path : List.of("followers", "following")) {
            mvc.perform(get("/users/2/" + path).with(user("melis")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("content[0].username").value("melis"))
                    .andExpect(jsonPath("content[0].email").doesNotExist())
                    .andExpect(jsonPath("totalElements").value(1));
        }
    }

    @Test
    void statsIncludeCurrentViewersFollowState() throws Exception {
        when(service.getStats(2L, "melis")).thenReturn(new FollowStatsResponse(3, 4, true));
        mvc.perform(get("/users/2/follow-stats").with(user("melis")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("followerCount").value(3))
                .andExpect(jsonPath("followingCount").value(4))
                .andExpect(jsonPath("followedByCurrentUser").value(true));
    }

    @ParameterizedTest
    @ValueSource(strings = {"page=-1", "size=0", "size=101", "page=abc"})
    void rejectsInvalidPagination(String query) throws Exception {
        mvc.perform(get("/users/2/followers?" + query).with(user("melis")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void rejectsInvalidUserId() throws Exception {
        mvc.perform(post("/users/0/follow").with(user("melis")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void businessErrorsHaveExpectedHttpStatuses() throws Exception {
        doThrow(new ResourceAlreadyExistsException("Already following")).when(service).follow(2L, "melis");
        doThrow(new ResourceNotFoundException("User not found")).when(service).follow(3L, "melis");
        doThrow(new AccessDeniedException("You cannot follow yourself")).when(service).follow(1L, "melis");
        mvc.perform(post("/users/2/follow").with(user("melis"))).andExpect(status().isConflict());
        mvc.perform(post("/users/3/follow").with(user("melis"))).andExpect(status().isNotFound());
        mvc.perform(post("/users/1/follow").with(user("melis"))).andExpect(status().isForbidden());
    }
}
