package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.Conversation;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByFirstUserIdAndSecondUserId(Long first, Long second);

    @EntityGraph(attributePaths = {"firstUser", "secondUser"})
    @Query("select c from Conversation c where c.firstUser.id = :userId or c.secondUser.id = :userId order by c.updatedAt desc, c.id desc")
    Page<Conversation> findForUser(@Param("userId") Long userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Conversation c where c.id = :id")
    Optional<Conversation> findLockedById(@Param("id") Long id);
}
