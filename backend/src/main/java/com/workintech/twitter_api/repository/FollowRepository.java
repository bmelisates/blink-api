package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    // Bu kullanıcı diğer kullanıcıyı takip ediyor mu?
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    // Takipten çıkarken silinecek ilişkiyi bulur.
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    // Kullanıcıyı takip edenler. İsimleri göstermek için follower da yüklenir.
    @EntityGraph(attributePaths = "follower")
    Page<Follow> findByFollowingIdOrderByCreatedAtDescIdDesc(Long followingId, Pageable pageable);

    // Kullanıcının takip ettikleri. Listeler sayfa sayfa getirilir.
    @EntityGraph(attributePaths = "following")
    Page<Follow> findByFollowerIdOrderByCreatedAtDescIdDesc(Long followerId, Pageable pageable);

    // Takipçi sayısı.
    long countByFollowingId(Long followingId);

    // Takip edilen kişi sayısı.
    long countByFollowerId(Long followerId);
}
