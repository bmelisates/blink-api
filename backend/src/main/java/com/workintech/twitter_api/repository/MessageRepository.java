package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("select m from Message m where m.conversation.id = :id and m.id < :before order by m.id desc")
    Slice<Message> findHistory(@Param("id") Long id, @Param("before") Long before, Pageable pageable);
    Optional<Message> findFirstByConversationIdOrderByIdDesc(Long conversationId);
    long countByConversationIdAndSenderIdNotAndReadAtIsNull(Long conversationId, Long userId);

    @Query("select count(m) from Message m where m.readAt is null and m.sender.id <> :userId and (m.conversation.firstUser.id = :userId or m.conversation.secondUser.id = :userId)")
    long countUnread(@Param("userId") Long userId);

    @Modifying
    @Query("update Message m set m.readAt = :now where m.conversation.id = :id and m.sender.id <> :viewer and m.readAt is null and m.id <= :through")
    int markRead(@Param("id") Long id, @Param("viewer") Long viewer,
                 @Param("through") Long through, @Param("now") OffsetDateTime now);
}
