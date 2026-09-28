package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.config.SecurityConfig;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.security.*;
import com.workintech.twitter_api.service.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {AuthController.class, FollowController.class}, properties = "jwt.secret=auth-test-only-secret-32-bytes-long-for-tests")
@Import({SecurityConfig.class, JwtService.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class AuthSecurityTest {
    static final String SECRET = "auth-test-only-secret-32-bytes-long-for-tests";
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @MockBean AuthService auth;
    @MockBean FollowService follows;
    @MockBean CustomUserDetailsService users;

    private CustomUserDetails principal(long version) {
        User u = new User(); u.setId(42L); u.setUsername("renamed"); u.setTokenVersion(version);
        return new CustomUserDetails(u);
    }

    @Test void wrongPasswordReturns401() throws Exception {
        when(auth.login(any())).thenThrow(new BadCredentialsException("Bad credentials"));
        mvc.perform(post("/auth/login").contentType("application/json")
                .content("{\"username\":\"wrong\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("statusCode").value(401));
    }

    @Test void validTokenUsesStableIdAndCurrentUsername() throws Exception {
        when(users.loadUserById(42L)).thenReturn(principal(0));
        mvc.perform(get("/users/1/follow-stats").header("Authorization", "Bearer " + jwt.generateToken(42L, 0)))
                .andExpect(status().isOk());
        verify(follows).getStats(1L, "renamed");
        verify(users, never()).loadUserByUsername(anyString());
    }

    @Test void passwordVersionChangeRejectsOldToken() throws Exception {
        when(users.loadUserById(42L)).thenReturn(principal(1));
        mvc.perform(get("/users/1/follow-stats").header("Authorization", "Bearer " + jwt.generateToken(42L, 0)))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(follows);
    }

    @Test void deletedUserTokenIsRejected() throws Exception {
        when(users.loadUserById(42L)).thenThrow(new org.springframework.security.core.userdetails.UsernameNotFoundException("gone"));
        mvc.perform(get("/users/1/follow-stats").header("Authorization", "Bearer " + jwt.generateToken(42L, 0)))
                .andExpect(status().isUnauthorized());
    }

    @Test void legacyNumericUsernameCannotBecomeAnId() throws Exception {
        String legacy = Jwts.builder().subject("42").expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
        mvc.perform(get("/users/1/follow-stats").header("Authorization", "Bearer " + legacy))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(users, follows);
    }

    @Test void expiredAndInvalidSignatureTokensAreRejected() throws Exception {
        String expired = Jwts.builder().subject("42").claim("type", "access-v2").claim("tokenVersion", 0)
                .expiration(new Date(1000)).signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
        String forged = Jwts.builder().subject("42").claim("type", "access-v2").claim("tokenVersion", 0)
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(Keys.hmacShaKeyFor("another-test-secret-at-least-32-bytes".getBytes(StandardCharsets.UTF_8))).compact();
        for (String token : new String[]{expired, forged, "malformed"}) {
            mvc.perform(get("/users/1/follow-stats").header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized());
        }
        verifyNoInteractions(users, follows);
    }
}
