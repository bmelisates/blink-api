package com.workintech.twitter_api.repository;

import com.workintech.twitter_api.entity.Follow;
import com.workintech.twitter_api.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

// Yalnızca açıkça seçilen PostgreSQL bağlantısında, rastgele ve ayrı bir şemada çalışır.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIfEnvironmentVariable(named = "FOLLOW_TEST_DATABASE_URL", matches = "jdbc:postgresql:.*")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class FollowRepositoryIntegrationTest {
    private static final String SCHEMA = "follow_test_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> System.getenv("FOLLOW_TEST_DATABASE_URL"));
        properties.add("spring.datasource.username", () -> System.getenv("FOLLOW_TEST_DATABASE_USERNAME"));
        properties.add("spring.datasource.password", () -> System.getenv("FOLLOW_TEST_DATABASE_PASSWORD"));
        properties.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        properties.add("spring.jpa.properties.hibernate.default_schema", () -> SCHEMA);
        properties.add("spring.jpa.properties.hibernate.hbm2ddl.create_namespaces", () -> "true");
        properties.add("spring.sql.init.mode", () -> "never");
    }

    @Autowired FollowRepository follows;
    @Autowired UserRepository users;
    @Autowired EntityManager entityManager;

    private User user(String name) {
        User user = new User();
        user.setUsername(name);
        user.setEmail(name + "@example.test");
        user.setPassword("test-only-password");
        return users.saveAndFlush(user);
    }

    private Follow follow(User from, User to) {
        Follow follow = new Follow();
        follow.setFollower(from);
        follow.setFollowing(to);
        return follows.saveAndFlush(follow);
    }

    @Test
    void databaseRejectsDuplicatePair() {
        User first = user("first");
        User second = user("second");
        follow(first, second);
        assertThrows(DataIntegrityViolationException.class, () -> follow(first, second));
    }

    @Test
    void databaseRejectsSelfFollow() {
        User first = user("first");
        assertThrows(DataIntegrityViolationException.class, () -> follow(first, first));
    }

    @Test
    void databaseRejectsMissingUser() {
        User first = user("first");
        User missing = entityManager.getReference(User.class, Long.MAX_VALUE);
        assertThrows(DataIntegrityViolationException.class, () -> follow(first, missing));
    }

    @Test
    void deletingUserCascadesBothDirectionsButPreservesOtherUsersAndFollows() {
        User first = user("first");
        User second = user("second");
        User third = user("third");
        follow(first, second);
        follow(second, first);
        Follow surviving = follow(second, third);

        // Native SQL: JPA cascade davranışından bağımsız olarak PostgreSQL FK'lerini doğrular.
        entityManager.createNativeQuery("delete from " + SCHEMA + ".users where id = :id")
                .setParameter("id", first.getId()).executeUpdate();
        entityManager.clear();
        assertEquals(1, follows.count());
        assertTrue(follows.existsById(surviving.getId()));
        assertEquals(2, users.count());
    }

    @Test
    void persistsTimestampAndQueriesDirectionalCountsAndPages() {
        User first = user("first");
        User second = user("second");
        User third = user("third");
        Follow older = follow(first, second);
        Follow newer = follow(third, second);
        entityManager.clear();

        assertNotNull(follows.findById(older.getId()).orElseThrow().getCreatedAt());
        assertTrue(follows.existsByFollowerIdAndFollowingId(first.getId(), second.getId()));
        assertFalse(follows.existsByFollowerIdAndFollowingId(second.getId(), first.getId()));
        assertEquals(2, follows.countByFollowingId(second.getId()));
        assertEquals(1, follows.countByFollowerId(first.getId()));
        var page = follows.findByFollowingIdOrderByCreatedAtDescIdDesc(second.getId(), PageRequest.of(0, 1));
        assertEquals(2, page.getTotalElements());
        assertEquals(newer.getId(), page.getContent().get(0).getId());
        assertEquals("third", page.getContent().get(0).getFollower().getUsername());
        assertEquals("second", follows.findByFollowerIdOrderByCreatedAtDescIdDesc(first.getId(), PageRequest.of(0, 20))
                .getContent().get(0).getFollowing().getUsername());
    }
}
