package com.workintech.twitter_api.controller;

import com.workintech.twitter_api.config.SecurityConfig;
import com.workintech.twitter_api.entity.Role;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.repository.UserRepository;
import com.workintech.twitter_api.security.*;
import com.workintech.twitter_api.service.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({UserServiceImpl.class, SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class})
class UserPrivacyTest {
    @Autowired MockMvc mvc;
    @MockBean UserRepository repository;
    @MockBean JwtService jwtService;
    @MockBean CustomUserDetailsService userDetailsService;
    User owner;

    @BeforeEach void setup() {
        owner = account(1L, "owner", "owner@example.com", Role.USER);
        User other = account(2L, "other", "other@example.com", Role.USER);
        User admin = account(3L, "admin", "admin@example.com", Role.ADMIN);
        for (User account : List.of(owner, other, admin)) {
            when(repository.findById(account.getId())).thenReturn(Optional.of(account));
            when(repository.findLockedById(account.getId())).thenReturn(Optional.of(account));
            when(repository.findByUsername(account.getUsername())).thenReturn(Optional.of(account));
        }
        when(repository.findAll()).thenReturn(List.of(owner, other));
        when(repository.findByUsernameContainingIgnoreCase("o")).thenReturn(List.of(owner, other));
        when(repository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test void profilesExposeEmailOnlyToOwnerEvenForAdmin() throws Exception {
        for (String path : List.of("/users/1", "/users/username/owner")) {
            mvc.perform(get(path).with(user("owner"))).andExpect(status().isOk())
                    .andExpect(jsonPath("email").value("owner@example.com"));
            for (String viewer : List.of("other", "admin")) {
                mvc.perform(get(path).with(user(viewer))).andExpect(status().isOk())
                        .andExpect(jsonPath("id").value(1))
                        .andExpect(jsonPath("username").value("owner"))
                        .andExpect(jsonPath("email").doesNotExist());
            }
        }
    }

    @Test void listsAndSearchNeverExposeEmail() throws Exception {
        for (String path : List.of("/users", "/users/search?keyword=o")) {
            mvc.perform(get(path).with(user("owner"))).andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].username").value("owner"))
                    .andExpect(jsonPath("$[1].username").value("other"))
                    .andExpect(jsonPath("$[*].email").isEmpty());
        }
    }

    @Test void emailLookupCannotIdentifyOtherAccounts() throws Exception {
        mvc.perform(get("/users/email/owner@example.com").with(user("owner")))
                .andExpect(status().isOk()).andExpect(jsonPath("email").value("owner@example.com"));
        for (String viewer : List.of("other", "admin")) {
            for (String email : List.of("owner@example.com", "missing@example.com")) {
                mvc.perform(get("/users/email/" + email).with(user(viewer)))
                        .andExpect(status().isForbidden());
            }
        }
        verify(repository, never()).findByEmail(any());
    }

    @Test void ownUpdateKeepsEmailAfterRenameButAdminUpdateDoesNotRevealIt() throws Exception {
        mvc.perform(put("/users/1").with(user("owner")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"renamed\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("username").value("renamed"))
                .andExpect(jsonPath("email").value("owner@example.com"));
        mvc.perform(put("/users/1").with(user("admin")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"changed\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("email").doesNotExist());
    }

    @Test void anonymousReadsRemainUnauthorized() throws Exception {
        for (String path : List.of("/users", "/users/1", "/users/username/owner",
                "/users/search?keyword=o", "/users/email/owner@example.com")) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
    }

    private User account(Long id, String username, String email, Role role) {
        User account = new User();
        account.setId(id);
        account.setUsername(username);
        account.setEmail(email);
        account.setRole(role);
        return account;
    }
}
