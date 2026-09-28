package com.workintech.twitter_api.service;

import com.workintech.twitter_api.entity.Follow;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.exception.ResourceAlreadyExistsException;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.repository.FollowRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowServiceImplTest {
    @Mock FollowRepository repository;
    @Mock UserService users;
    @InjectMocks FollowServiceImpl service;

    private User user(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        return user;
    }

    private void arrangeUsers() {
        when(users.findEntityByUsername("melis")).thenReturn(user(1L, "melis"));
        when(users.findEntityById(2L)).thenReturn(user(2L, "ayse"));
    }

    @Test
    void followsTargetAsAuthenticatedUser() {
        arrangeUsers();
        service.follow(2L, "melis");
        ArgumentCaptor<Follow> saved = ArgumentCaptor.forClass(Follow.class);
        verify(repository).saveAndFlush(saved.capture());
        assertEquals(1L, saved.getValue().getFollower().getId());
        assertEquals(2L, saved.getValue().getFollowing().getId());
    }

    @Test
    void rejectsSelfFollowBeforeWriting() {
        User current = user(1L, "melis");
        when(users.findEntityByUsername("melis")).thenReturn(current);
        when(users.findEntityById(1L)).thenReturn(current);
        assertThrows(AccessDeniedException.class, () -> service.follow(1L, "melis"));
        verifyNoInteractions(repository);
    }

    @Test
    void rejectsDuplicateFollow() {
        arrangeUsers();
        when(repository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);
        assertThrows(ResourceAlreadyExistsException.class, () -> service.follow(2L, "melis"));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsMissingTargetBeforeWriting() {
        when(users.findEntityByUsername("melis")).thenReturn(user(1L, "melis"));
        when(users.findEntityById(2L)).thenThrow(new ResourceNotFoundException("User not found"));
        assertThrows(ResourceNotFoundException.class, () -> service.follow(2L, "melis"));
        verifyNoInteractions(repository);
    }

    @Test
    void unfollowDeletesOnlyCurrentUsersRelationship() {
        arrangeUsers();
        Follow follow = new Follow();
        when(repository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(follow));
        service.unfollow(2L, "melis");
        verify(repository).delete(follow);
    }

    @Test
    void unfollowIsHarmlessWhenRelationshipDoesNotExist() {
        arrangeUsers();
        when(repository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> service.unfollow(2L, "melis"));
        verify(repository, never()).delete(any());
    }

    @Test
    void listsCorrectSideOfRelationshipAndPreservesPageTotals() {
        when(users.findEntityById(2L)).thenReturn(user(2L, "ayse"));
        Follow follow = new Follow();
        follow.setFollower(user(1L, "melis"));
        follow.setFollowing(user(2L, "ayse"));
        var pageable = PageRequest.of(0, 1);
        var page = new PageImpl<>(List.of(follow), pageable, 3);
        when(repository.findByFollowingIdOrderByCreatedAtDescIdDesc(2L, pageable)).thenReturn(page);
        when(repository.findByFollowerIdOrderByCreatedAtDescIdDesc(2L, pageable)).thenReturn(page);
        var followers = service.findFollowers(2L, pageable);
        assertEquals("melis", followers.getContent().get(0).username());
        assertEquals(3, followers.getTotalElements());
        assertEquals("ayse", service.findFollowing(2L, pageable).getContent().get(0).username());
    }

    @Test
    void statsUseCorrectDirectionAndViewer() {
        arrangeUsers();
        when(repository.countByFollowingId(2L)).thenReturn(5L);
        when(repository.countByFollowerId(2L)).thenReturn(7L);
        when(repository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);
        var stats = service.getStats(2L, "melis");
        assertEquals(5, stats.followerCount());
        assertEquals(7, stats.followingCount());
        assertTrue(stats.followedByCurrentUser());
    }
}
