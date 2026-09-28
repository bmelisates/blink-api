# Blink

Blink is a full-stack microblogging project built with Java 17, Spring Boot, PostgreSQL, React and Vite.

## Features

- Registration and JWT authentication with Spring Security.
- Posts, replies, likes and retweets.
- User profiles and user/post search.
- Follow/unfollow, profile counters and paginated follower/following lists.
- Turkish/English interface and theme switching.

The home feed currently shows the general timeline. Following a user does **not** filter the home feed.

## Project structure

```text
backend/                 Spring Boot REST API
  src/main/java/         Controller → Service → Repository → Entity
  src/test/java/         Service, HTTP/security and PostgreSQL tests
frontend/twitter-api/    React application
```

## Run locally

Prerequisites: Java 17, Maven, Node.js/npm and PostgreSQL. Create a local database named `twitterdb` and configure the ignored `backend/src/main/resources/application.properties` file:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/twitterdb
spring.datasource.username=postgres
spring.datasource.password=YOUR_LOCAL_DATABASE_PASSWORD
spring.jpa.hibernate.ddl-auto=update
jwt.secret=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_BYTES
server.port=8080
```

Keep real credentials out of Git. `ddl-auto=update` is the current local development setup; versioned schema migrations remain future work.

In `frontend/twitter-api/.env`:

```dotenv
VITE_API_URL=http://localhost:8080
```

Start the API and frontend in separate PowerShell terminals:

```powershell
cd backend
mvn.cmd spring-boot:run
```

```powershell
cd frontend/twitter-api
npm.cmd ci
npm.cmd run dev
```

Open <http://localhost:5173>. The API runs on port 8080. The local frontend origin allowed by CORS is `http://localhost:5173`.

## Follow API

All follow endpoints require `Authorization: Bearer <token>`. The authenticated user is the actor; `{userId}` identifies the target profile. Mutation requests do not need a body.

| Method | Endpoint | Result |
| --- | --- | --- |
| POST | `/users/{userId}/follow` | Follow the target; 201 |
| DELETE | `/users/{userId}/follow` | Unfollow the target; 204, including when already unfollowed |
| GET | `/users/{userId}/followers` | Paginated followers |
| GET | `/users/{userId}/following` | Paginated followed users |
| GET | `/users/{userId}/follow-stats` | `followerCount`, `followingCount`, `followedByCurrentUser` |

Lists accept zero-based `page` (default 0) and `size` (default 20, range 1–100). Their `content` contains only user `id` and `username`, with page metadata such as `totalElements`, `totalPages` and `last`.

Errors: 400 for invalid IDs/pagination, 401 without authentication, 403 for self-follow, 404 for a missing user and 409 for an existing follow or database constraint conflict.

The `follows` table stores two user foreign keys and a creation timestamp. A unique pair constraint prevents duplicate follows; a check constraint prevents self-follow. Both foreign keys use `ON DELETE CASCADE`, so deleting either user removes the relationship, not the other user. Lists sort newest first with ID as a tie-breaker.

## Verification

From `backend`, run the isolated service and HTTP/security tests:

```powershell
mvn.cmd "-Dtest=FollowServiceImplTest,FollowControllerTest" test
```

For real PostgreSQL tests, explicitly select a **local/test** database and credentials in the terminal, then run:

```powershell
$env:FOLLOW_TEST_DATABASE_URL = 'jdbc:postgresql://localhost:5432/twitterdb'
$env:FOLLOW_TEST_DATABASE_USERNAME = 'postgres'
$env:FOLLOW_TEST_DATABASE_PASSWORD = 'YOUR_LOCAL_DATABASE_PASSWORD'
mvn.cmd "-Dtest=FollowRepositoryIntegrationTest" test
```

The integration suite creates a randomly named `follow_test_*` schema, qualifies entity tables with that schema, rolls back test data and drops its schema on normal context shutdown. It does not use the application's `public` tables. The database user needs permission to create schemas. Without `FOLLOW_TEST_DATABASE_URL`, these tests are skipped. An interrupted JVM may leave its isolated test schema behind.

These tests cover duplicate/self-follow rejection, foreign-key enforcement, deletion cleanup in both directions, preservation of unrelated relationships, timestamps, counts and pagination. The original application context test is separate and uses application configuration; the commands above deliberately select only follow tests.

From `frontend/twitter-api`:

```powershell
npm.cmd run lint
npm.cmd run build
```

Manual browser verification: follow another profile, check both profile counters/lists, reload to verify persistence, then unfollow. The profile and sidebar buttons should stay in sync, and an empty list should show an empty state. Multi-page and network-failure UI behavior need additional browser coverage.

## Project background

Blink began as a Workintech backend exercise and was expanded into a full-stack application. The original assignment is preserved in [backend/README.md](backend/README.md).
