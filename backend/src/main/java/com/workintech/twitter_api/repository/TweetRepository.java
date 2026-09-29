package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.Tweet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TweetRepository extends JpaRepository<Tweet, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tweet t where t.id = :id")
    Optional<Tweet> findLockedById(@Param("id") Long id);

    // Belirli bir kullanıcının tweet'lerini getirir(Yeniden eskiye)
    List<Tweet> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Belirli bir kullanıcının tweet sayısını getirir
    long countByUserIdAndDeletedFalse(Long userId);

    // Parent tweetin alt tweet'lerini getirir
    List<Tweet> findByParentTweetIdOrderByCreatedAtAsc(Long parentTweetId);

    // Tweet içeriğinde arama yapar(Yeniden eskiye)
    List<Tweet> findByDeletedFalseAndContentContainingIgnoreCaseOrderByCreatedAtDesc(String keyword);

    // Belirli bir kullanıcının tweet'lerini arama yapar(Yeniden eskiye)
    List<Tweet> findByUserIdAndDeletedFalseAndContentContainingIgnoreCaseOrderByCreatedAtDesc(Long userId, String keyword);

    // Kullanıcının beğendiği tweet'leri getirir
    List<Tweet> findByLikesUserIdOrderByCreatedAtDesc(Long userId);

    // Kullanıcının retweet ettiği tweet'leri getirir
    List<Tweet> findByRetweetsUserIdOrderByCreatedAtDesc(Long userId);

    // Tüm akışı kullanıcı bilgisiyle çeker
    @Query("SELECT t FROM Tweet t JOIN FETCH t.user LEFT JOIN FETCH t.parentTweet pt LEFT JOIN FETCH pt.user WHERE t.deleted = false ORDER BY t.createdAt DESC")
    List<Tweet> findAllTweetsWithUser();

    // Kullanıcının tweet'lerini kullanıcı bilgisiyle çeker
    @Query("SELECT t FROM Tweet t JOIN FETCH t.user WHERE t.user.id = :userId AND t.deleted = false ORDER BY t.createdAt DESC")
    List<Tweet> findByUserIdWithUser(@Param("userId") Long userId);

    // Tek bir tweet'i detay sayfası için kullanıcı bilgisiyle çeker
    @Query("SELECT t FROM Tweet t JOIN FETCH t.user WHERE t.id = :tweetId")
    Optional<Tweet> findByIdWithUser(@Param("tweetId") Long tweetId);

}
