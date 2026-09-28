package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.UserUpdateRequest;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserSessionTest {
    @Test void passwordUpdateRevokesPreviousSessionsButUsernameChangeDoesNot() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserServiceImpl service = new UserServiceImpl(repository, encoder);
        User user = new User(); user.setId(1L); user.setUsername("before");
        when(repository.findLockedById(1L)).thenReturn(Optional.of(user));
        when(repository.save(user)).thenReturn(user);
        when(encoder.encode("new-password")).thenReturn("hashed-password");
        UserUpdateRequest rename = new UserUpdateRequest(); rename.setUsername("after");
        service.updateUser(1L, rename);
        assertEquals(0, user.getTokenVersion());
        UserUpdateRequest password = new UserUpdateRequest(); password.setPassword("new-password");
        service.updateUser(1L, password);
        assertEquals(1, user.getTokenVersion());
        assertEquals("hashed-password", user.getPassword());
    }
}
