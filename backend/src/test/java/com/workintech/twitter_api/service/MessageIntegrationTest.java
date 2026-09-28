package com.workintech.twitter_api.service;

import com.workintech.twitter_api.dto.MessageRequest;
import com.workintech.twitter_api.entity.User;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@DataJpaTest
@Import(MessageServiceImpl.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIfEnvironmentVariable(named = "FOLLOW_TEST_DATABASE_URL", matches = "jdbc:postgresql:.*")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MessageIntegrationTest {
    private static final String SCHEMA = "message_test_" + UUID.randomUUID().toString().replace("-", "");
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
    @Autowired MessageService service;
    @Autowired UserRepository users;
    @Autowired MessageRepository messages;
    @Autowired ConversationRepository conversations;
    @Autowired EntityManager em;
    @MockBean UserService userService;
    User alice;
    User bob;
    User eve;

    @BeforeEach
    void setup() {
        alice = user("alice"); bob = user("bob"); eve = user("eve");
        when(userService.findEntityByUsername(anyString())).thenAnswer(call -> users.findByUsername(call.getArgument(0))
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
        when(userService.findEntityById(anyLong())).thenAnswer(call -> users.findById(call.getArgument(0))
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    private User user(String name) {
        User u = new User(); u.setUsername(name); u.setEmail(name + "@example.test"); u.setPassword("test-password");
        return users.saveAndFlush(u);
    }

    @Test
    void everyoneCanStartWithoutFollowingAndReverseOpenReusesConversation() {
        var c = service.open(bob.getId(), "alice");
        assertEquals(c.id(), service.open(alice.getId(), "bob").id());
        assertEquals(1, conversations.count());
        assertEquals("bob", c.participant().username());
        assertThrows(IllegalArgumentException.class, () -> service.open(alice.getId(), "alice"));
        assertThrows(ResourceNotFoundException.class, () -> service.open(Long.MAX_VALUE, "alice"));
    }

    @Test
    void outsiderCannotReadSendOrMarkReadEvenWithConversationId() {
        var c = service.open(bob.getId(), "alice");
        var m = service.send(c.id(), new MessageRequest("private"), "alice");
        assertThrows(AccessDeniedException.class, () -> service.conversation(c.id(), "eve"));
        assertThrows(AccessDeniedException.class, () -> service.history(c.id(), null, 20, "eve"));
        assertThrows(AccessDeniedException.class, () -> service.send(c.id(), new MessageRequest("intrusion"), "eve"));
        assertThrows(AccessDeniedException.class, () -> service.markRead(c.id(), m.id(), "eve"));
        assertEquals(0, service.conversations("eve", PageRequest.of(0, 20)).getTotalElements());
        assertEquals(0, service.unreadCount("eve"));
    }

    @Test
    void readBoundaryAffectsOnlyIncomingMessagesAndDoesNotConsumeNewerOnes() {
        var c = service.open(bob.getId(), "alice");
        var first = service.send(c.id(), new MessageRequest("one"), "alice");
        var second = service.send(c.id(), new MessageRequest("two"), "alice");
        var reply = service.send(c.id(), new MessageRequest("reply"), "bob");
        assertEquals(2, service.unreadCount("bob"));
        assertEquals(1, service.unreadCount("alice"));
        service.markRead(c.id(), first.id(), "bob");
        em.clear();
        assertEquals(1, service.unreadCount("bob"));
        assertNotNull(messages.findById(first.id()).orElseThrow().getReadAt());
        assertNull(messages.findById(second.id()).orElseThrow().getReadAt());
        service.markRead(c.id(), reply.id(), "bob");
        em.clear();
        assertEquals(0, service.unreadCount("bob"));
        assertNull(messages.findById(reply.id()).orElseThrow().getReadAt());
        assertEquals(1, service.unreadCount("alice"));
    }

    @Test
    void cursorPaginationDoesNotRepeatMessagesAfterNewArrival() {
        var c = service.open(bob.getId(), "alice");
        var first = service.send(c.id(), new MessageRequest("one"), "alice");
        var second = service.send(c.id(), new MessageRequest("two"), "alice");
        var newest = service.history(c.id(), null, 1, "bob");
        assertEquals(second.id(), newest.content().get(0).id());
        assertTrue(newest.hasMore());
        service.send(c.id(), new MessageRequest("three"), "alice");
        var older = service.history(c.id(), second.id(), 1, "bob");
        assertEquals(first.id(), older.content().get(0).id());
        assertFalse(older.hasMore());
    }

    @Test
    void inboxOnlyContainsParticipantConversationsWithPreviewAndUnreadCount() {
        var ab = service.open(bob.getId(), "alice");
        var be = service.open(eve.getId(), "bob");
        service.send(be.id(), new MessageRequest("other conversation"), "eve");
        var m = service.send(ab.id(), new MessageRequest("hello"), "bob");
        var inbox = service.conversations("alice", PageRequest.of(0, 20));
        assertEquals(1, inbox.getTotalElements());
        assertEquals(m.id(), inbox.getContent().get(0).lastMessage().id());
        assertEquals(1, inbox.getContent().get(0).unreadCount());
        assertNotNull(m.createdAt());
    }

    @Test
    void removingUserCleansMessagesWithoutDeletingOtherUsers() {
        var ab = service.open(bob.getId(), "alice");
        var be = service.open(eve.getId(), "bob");
        service.send(ab.id(), new MessageRequest("one"), "alice");
        service.send(ab.id(), new MessageRequest("two"), "bob");
        service.send(be.id(), new MessageRequest("keep"), "eve");
        em.createNativeQuery("delete from " + SCHEMA + ".users where id = :id").setParameter("id", alice.getId()).executeUpdate();
        em.clear();
        assertEquals(1, messages.count());
        assertEquals(1, conversations.count());
        assertEquals(2, users.count());
    }
}
