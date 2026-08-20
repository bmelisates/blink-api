package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {

    // Belirli bir kullanıcının beğeni'lerini getirir
    List<Like> findByUserId(Long userId);

    // Belirli bir tweetin beğeni'lerini getirir
    List<Like> findByTweetId(Long tweetId);

    // Kullanıcının bu tweet'i beğenip beğenmediğini bulur (Unlike yapmak için)
    Optional<Like> findByUserIdAndTweetId(Long userId, Long tweetId);

    // Tweet'in toplam beğeni sayısını performanslıca getirir
    long countByTweetId(Long tweetId);

    // Kullanıcının bu tweet'i beğenip beğenmediğini boolean döner (UI kontrolleri için)
    boolean existsByUserIdAndTweetId(Long userId, Long tweetId);
}
