package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.FollowStatsResponse;
import com.workintech.twitter_api.dto.FollowUserResponse;
import com.workintech.twitter_api.entity.Follow;
import com.workintech.twitter_api.entity.User;
import com.workintech.twitter_api.exception.ResourceAlreadyExistsException;
import com.workintech.twitter_api.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowServiceImpl implements FollowService {
    private final FollowRepository followRepository;
    private final UserService userService;

    @Override
    @Transactional
    public void follow(Long followingId, String currentUsername) {
        // Controller bu ismi istek gövdesinden değil, doğrulanmış oturumdan alacak.
        User follower = userService.findEntityByUsername(currentUsername);
        User following = userService.findEntityById(followingId);

        if (follower.getId().equals(following.getId())) {
            throw new AccessDeniedException("You cannot follow yourself");
        }
        if (followRepository.existsByFollowerIdAndFollowingId(follower.getId(), followingId)) {
            throw new ResourceAlreadyExistsException("You already follow this user");
        }

        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        // Eşzamanlı isteklerde benzersizlik kısıtı da koruma sağlar.
        followRepository.saveAndFlush(follow);
    }

    @Override
    @Transactional
    public void unfollow(Long followingId, String currentUsername) {
        User follower = userService.findEntityByUsername(currentUsername);
        userService.findEntityById(followingId);
        // Zaten takip edilmiyorsa işlem başarıyla sonlanır.
        followRepository.findByFollowerIdAndFollowingId(follower.getId(), followingId)
                .ifPresent(followRepository::delete);
    }

    @Override
    public Page<FollowUserResponse> findFollowers(Long userId, Pageable pageable) {
        userService.findEntityById(userId);
        return followRepository.findByFollowingIdOrderByCreatedAtDescIdDesc(userId, pageable)
                .map(follow -> toResponse(follow.getFollower()));
    }

    @Override
    public Page<FollowUserResponse> findFollowing(Long userId, Pageable pageable) {
        userService.findEntityById(userId);
        return followRepository.findByFollowerIdOrderByCreatedAtDescIdDesc(userId, pageable)
                .map(follow -> toResponse(follow.getFollowing()));
    }

    @Override
    public FollowStatsResponse getStats(Long userId, String currentUsername) {
        userService.findEntityById(userId);
        User viewer = userService.findEntityByUsername(currentUsername);
        return new FollowStatsResponse(
                followRepository.countByFollowingId(userId),
                followRepository.countByFollowerId(userId),
                followRepository.existsByFollowerIdAndFollowingId(viewer.getId(), userId));
    }

    private FollowUserResponse toResponse(User user) {
        return new FollowUserResponse(user.getId(), user.getUsername());
    }
}
