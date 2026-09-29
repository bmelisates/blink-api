package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.config.SecurityConfig;
import com.workintech.twitter_api.entity.*;
import com.workintech.twitter_api.security.*;
import com.workintech.twitter_api.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({LikeController.class, RetweetController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class InteractionControllerTest {
    @Autowired MockMvc mvc;
    @MockBean LikeService likes;
    @MockBean RetweetService retweets;
    @MockBean UserService users;
    @MockBean JwtService jwtService;
    @MockBean CustomUserDetailsService userDetailsService;

    private User actor(long id) {
        User result = new User(); result.setId(id); return result;
    }

    @Test void cannotRemoveAnotherUsersInteractions() throws Exception {
        when(users.findEntityByUsername("alice")).thenReturn(actor(1));
        Like like = new Like(); like.setUser(actor(2));
        Retweet retweet = new Retweet(); retweet.setUser(actor(2));
        when(likes.findEntityById(5L)).thenReturn(like);
        when(retweets.findEntityById(6L)).thenReturn(retweet);
        mvc.perform(delete("/likes/5").with(user("alice"))).andExpect(status().isForbidden());
        mvc.perform(delete("/retweets/6").with(user("alice"))).andExpect(status().isForbidden());
        verify(likes, never()).deleteLike(anyLong());
        verify(retweets, never()).deleteRetweet(anyLong());
    }

    @Test void ownerCanRemoveInteractionsAndUnlikeUsesAuthenticatedIdentity() throws Exception {
        when(users.findEntityByUsername("alice")).thenReturn(actor(1));
        Like like = new Like(); like.setUser(actor(1));
        Retweet retweet = new Retweet(); retweet.setUser(actor(1));
        when(likes.findEntityById(5L)).thenReturn(like);
        when(retweets.findEntityById(6L)).thenReturn(retweet);
        mvc.perform(delete("/likes/5").with(user("alice"))).andExpect(status().isNoContent());
        mvc.perform(delete("/retweets/6").with(user("alice"))).andExpect(status().isNoContent());
        mvc.perform(delete("/likes/tweet/7").param("userId", "2").with(user("alice")))
                .andExpect(status().isNoContent());
        verify(likes).deleteLike(5L);
        verify(retweets).deleteRetweet(6L);
        verify(likes).deleteLikeByUserIdAndTweetId(1L, 7L);
    }

    @Test void anonymousMutationsRequireLogin() throws Exception {
        for (String path : new String[]{"/likes", "/retweets"}) {
            mvc.perform(post(path).contentType("application/json").content("{\"tweetId\":7}"))
                    .andExpect(status().isUnauthorized());
            mvc.perform(delete(path + "/5")).andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(likes, retweets);
    }
}
