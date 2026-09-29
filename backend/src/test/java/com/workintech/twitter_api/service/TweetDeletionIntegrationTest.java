package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.*;
import com.workintech.twitter_api.entity.*;
import com.workintech.twitter_api.exception.ResourceNotFoundException;
import com.workintech.twitter_api.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@DataJpaTest
@Import({TweetServiceImpl.class, LikeServiceImpl.class, RetweetServiceImpl.class})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIfEnvironmentVariable(named = "FOLLOW_TEST_DATABASE_URL", matches = "jdbc:postgresql:.*")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class TweetDeletionIntegrationTest {
    private static final String SCHEMA = "tweet_test_" + UUID.randomUUID().toString().replace("-", "");
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry p) {
        p.add("spring.datasource.url", () -> System.getenv("FOLLOW_TEST_DATABASE_URL"));
        p.add("spring.datasource.username", () -> System.getenv("FOLLOW_TEST_DATABASE_USERNAME"));
        p.add("spring.datasource.password", () -> System.getenv("FOLLOW_TEST_DATABASE_PASSWORD"));
        p.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        p.add("spring.jpa.properties.hibernate.default_schema", () -> SCHEMA);
        p.add("spring.jpa.properties.hibernate.hbm2ddl.create_namespaces", () -> "true");
        p.add("spring.sql.init.mode", () -> "never");
    }
    @Autowired TweetService service;
    @Autowired LikeService likeService;
    @Autowired RetweetService retweetService;
    @Autowired TweetRepository tweets;
    @Autowired UserRepository users;
    @Autowired LikeRepository likes;
    @Autowired RetweetRepository retweets;
    @Autowired EntityManager em;
    @MockBean UserService userService;
    User alice;
    User bob;

    @BeforeEach void setup() {
        alice = user("alice", Role.USER); bob = user("bob", Role.USER);
        user("admin", Role.ADMIN);
        when(userService.findEntityByUsername(anyString())).thenAnswer(call -> users.findByUsername(call.getArgument(0)).orElseThrow());
        when(userService.findEntityById(anyLong())).thenAnswer(call -> users.findById(call.getArgument(0)).orElseThrow());
    }
    private User user(String name, Role role) {
        User user = new User(); user.setUsername(name); user.setEmail(name + "@example.test");
        user.setPassword("test-password"); user.setRole(role); return users.saveAndFlush(user);
    }
    private TweetResponse post(String text, Long parent, String author) {
        return service.createTweet(new TweetRequest(text, parent), author);
    }

    @Test void deletionPreservesReplyChainAndRemovesContentAndInteractions() {
        var root = post("original secret content", null, "alice");
        var reply = post("reply remains", root.getId(), "bob");
        var nested = post("nested remains", reply.getId(), "alice");
        likeService.createLike(bob.getId(), new LikeRequest(root.getId()));
        retweetService.createRetweet(bob.getId(), new RetweetRequest(root.getId()));
        em.flush(); em.clear();
        service.deleteTweet(root.getId(), "alice");
        em.clear();
        var deleted = service.findById(root.getId(), "bob");
        assertTrue(deleted.isDeleted()); assertNull(deleted.getContent()); assertNull(deleted.getUser());
        assertEquals("[deleted]", tweets.findById(root.getId()).orElseThrow().getContent());
        assertEquals(0, likes.count()); assertEquals(0, retweets.count());
        var kept = service.findById(reply.getId(), "bob");
        assertEquals("reply remains", kept.getContent());
        assertEquals(root.getId(), kept.getParentTweet().getId()); assertTrue(kept.getParentTweet().isDeleted());
        assertEquals(reply.getId(), service.findById(nested.getId(), "alice").getParentTweet().getId());
        assertEquals(1, service.findByParentTweetId(root.getId(), "alice").size());
        assertTrue(service.findAll("alice").stream().noneMatch(t -> t.getId().equals(root.getId())));
        assertTrue(service.findByUserId(alice.getId(), "alice").stream().noneMatch(t -> t.getId().equals(root.getId())));
        assertTrue(service.search("original", null).isEmpty());
        assertEquals(1, service.countByUserId(alice.getId()));
    }

    @Test void deletedReplyRemainsAsPlaceholderWithItsChildren() {
        var root = post("root", null, "alice");
        var reply = post("reply", root.getId(), "bob");
        var nested = post("nested", reply.getId(), "alice");
        em.flush(); em.clear();
        service.deleteTweet(reply.getId(), "bob"); em.clear();
        var children = service.findByParentTweetId(root.getId(), "alice");
        assertEquals(1, children.size()); assertTrue(children.get(0).isDeleted());
        assertEquals(1, children.get(0).getReplyCount());
        assertEquals(nested.getId(), service.findByParentTweetId(reply.getId(), "alice").get(0).getId());
    }

    @Test void deletedPostRejectsNewInteractionsAndEditing() {
        var root = post("root", null, "alice");
        service.deleteTweet(root.getId(), "alice");
        assertThrows(ResourceNotFoundException.class, () -> post("reply", root.getId(), "bob"));
        assertThrows(ResourceNotFoundException.class, () -> likeService.createLike(bob.getId(), new LikeRequest(root.getId())));
        assertThrows(ResourceNotFoundException.class, () -> retweetService.createRetweet(bob.getId(), new RetweetRequest(root.getId())));
        assertThrows(ResourceNotFoundException.class, () -> service.updateTweet(root.getId(), new TweetRequest("restore", null), "alice"));
    }

    @Test void deletionRequiresOwnerOrAdminAndIsRepeatableForOwner() {
        var root = post("root", null, "alice");
        assertThrows(AccessDeniedException.class, () -> service.deleteTweet(root.getId(), "bob"));
        assertFalse(tweets.findById(root.getId()).orElseThrow().isDeleted());
        service.deleteTweet(root.getId(), "admin");
        assertDoesNotThrow(() -> service.deleteTweet(root.getId(), "alice"));
    }

    @Test void interactionResponsesDoNotExposeEmailAddresses() {
        var root = post("root", null, "alice");
        var like = likeService.createLike(bob.getId(), new LikeRequest(root.getId()));
        var retweet = retweetService.createRetweet(bob.getId(), new RetweetRequest(root.getId()));
        assertNull(like.getUser().getEmail());
        assertNull(like.getTweet().getUser().getEmail());
        assertNull(retweet.getUser().getEmail());
        assertNull(retweet.getTweet().getUser().getEmail());
        assertEquals("bob", like.getUser().getUsername());
    }

    @Test void repliesIncludeViewerInteractionStateAndCounts() {
        var root = post("root", null, "alice");
        var reply = post("reply", root.getId(), "alice");
        likeService.createLike(bob.getId(), new LikeRequest(reply.getId()));
        retweetService.createRetweet(bob.getId(), new RetweetRequest(reply.getId()));
        em.flush(); em.clear();
        var seenByBob = service.findByParentTweetId(root.getId(), "bob").get(0);
        assertTrue(seenByBob.isLikedByCurrentUser());
        assertTrue(seenByBob.isRetweetedByCurrentUser());
        assertEquals(1, seenByBob.getLikeCount());
        assertEquals(1, seenByBob.getRetweetCount());
        var seenByAlice = service.findByParentTweetId(root.getId(), "alice").get(0);
        assertFalse(seenByAlice.isLikedByCurrentUser());
        assertFalse(seenByAlice.isRetweetedByCurrentUser());
    }

    @Test void editingRequiresOwnerAndPreservesReplyParent() {
        var root = post("root", null, "alice");
        var reply = post("reply", root.getId(), "bob");
        assertThrows(AccessDeniedException.class, () -> service.updateTweet(reply.getId(), new TweetRequest("changed", null), "alice"));
        var updated = service.updateTweet(reply.getId(), new TweetRequest("edited reply", null), "bob");
        assertEquals("edited reply", updated.getContent());
        assertEquals(root.getId(), updated.getParentTweet().getId());
    }
}
