# Blink

Blink is a full-stack microblogging project built with Java 17, Spring Boot, PostgreSQL, React and Vite.

## Features

- Registration and JWT authentication with Spring Security.
- Posts, replies, likes and retweets.
- User profiles and user/post search.
- Follow/unfollow, profile counters and paginated follower/following lists.
- Private one-to-one messages, conversation previews, unread counts and read receipts.
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

## Portfolio deployment

The portfolio uses Vercel for the frontend, a Render Free web service for the Java API, and Neon for PostgreSQL. The API can sleep when idle. On initial load, the frontend checks `GET /health`, explains the cold start, and continues automatically once the API and database respond. A failed connection offers a retry; writes are never automatically retried.

Configure these environment variables on Render (Docker build from `backend`):

```dotenv
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_NEON_POOLER_HOST/blink_demo?sslmode=require&connectTimeout=10&socketTimeout=30
SPRING_DATASOURCE_USERNAME=YOUR_DATABASE_ROLE
SPRING_DATASOURCE_PASSWORD=YOUR_DATABASE_PASSWORD
JWT_SECRET=YOUR_RANDOM_SECRET_OF_AT_LEAST_32_BYTES
```

Use `/health` as the Render health check path. The production profile reads `PORT` (default 10000), limits the database pool to five connections, and disables SQL debug logging. Schema creation/update currently uses Hibernate; versioned migrations are future work.

On Vercel, use `frontend/twitter-api` as the root directory and set `VITE_API_URL` to the Render API origin before building. The allowed production frontend origin is `https://blink-social.vercel.app`; update the backend CORS configuration if hosting under another origin.

### Sample data

Use a **separate, empty database** with the application's schema initialized, then run:

```powershell
# Set PGHOST, PGDATABASE, PGUSER, PGPASSWORD and PGSSLMODE=require in your terminal.
psql -v ON_ERROR_STOP=1 -f backend/db/seed-portfolio.sql
```

The transactional seed refuses databases containing users or posts and never deletes existing data. It creates six fictional users, eight posts, five replies, likes, retweets, follows and two conversations. The intentionally public demo account is **`demo` / `BlinkDemo2026!`**, with the ordinary `USER` role. Other sample accounts have randomly generated passwords. Demo changes are shared and persisted on the server; this is not an isolated browser-only sandbox. Do not enter private information in the shared account. Visitors can also register their own accounts.

## Follow API

User lists and search results contain public profile fields only. Individual user profiles and update responses include an email address only for the authenticated account owner, including when the viewer is an admin. Email lookup is restricted to the caller's own address; other addresses return 403 without looking up the target account. Privacy regression tests: `mvn.cmd "-Dtest=UserPrivacyTest" test` from `backend`.

Authentication uses signed, seven-day access tokens whose subject is the immutable user ID. Tokens also carry an access-token format marker and the user's `token_version`. Password updates increment that version, invalidating previous tokens on subsequent requests. Existing databases receive the version column with a default of zero through the current Hibernate development schema update.

Username-based tokens from earlier versions are intentionally rejected; users must sign in again after this update. Logout removes local credentials (also reflected in other tabs); it does not revoke an already copied token on the server. Password changes do revoke previous tokens. The frontend clears the active session on expiry or an authenticated 401 response, without letting a late response from a previous login clear a newer session. Server signature/expiry/version checks remain authoritative.

Auth regression tests: `mvn.cmd "-Dtest=AuthSecurityTest,UserSessionTest" test` from `backend`. Frontend session tests: `npm.cmd test` from `frontend/twitter-api`.

On 2026-09-28 the combined backend feature suite passed 47 tests, and the frontend session suite passed 5 tests alongside lint/build. Browser verification confirmed successful login, incorrect-credential feedback, and redirection to login after logout when using Back or opening `/messages` directly. Password-change revocation and invalid/expired tokens were verified by automated tests; no real user's password was changed for testing.

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

## Private messages

Any authenticated user can start a conversation with another user; following is not required. Self-messaging is rejected. The profile's **Send message** button opens or reuses the pair's conversation, and the **Messages** navigation item shows the unread message count.

| Method | Endpoint | Result |
| --- | --- | --- |
| POST | `/conversations/with/{userId}` | Open or reuse a conversation; 200 |
| GET | `/conversations?page=0&size=20` | Current user's conversations, newest activity first |
| GET | `/conversations/{id}` | Participant, last message and unread count |
| GET | `/conversations/{id}/messages?size=30&before=123` | Newest-first history; `before` is an optional exclusive message-ID cursor |
| POST | `/conversations/{id}/messages` | Send `{ "content": "Hello" }`; 201 |
| PUT | `/conversations/{id}/read?through=123` | Mark incoming messages through this ID as read; 204 |
| GET | `/conversations/unread-count` | `{ "count": 0 }` for the authenticated user |

All endpoints require JWT authentication. Every operation on an individual conversation checks membership, including sending and marking messages read. Another user (including an unrelated admin) cannot access the conversation by guessing its ID. Message content must be nonblank and at most 2,000 characters. Page sizes are bounded to 1–100.

`conversations` stores the user pair in ascending ID order, protected by a unique constraint. A user-row lock serializes concurrent conversation creation for that pair. `messages` stores the sender, content, creation time and read time; history uses an ID cursor so new arrivals do not shift older pages. Conversation locks serialize message writes and read updates. Deleting a participant removes the conversation and its messages via database cascades.

The UI polls the inbox/open conversation every 5 seconds and the sidebar count every 10 seconds while visible. Opening a conversation marks loaded incoming messages as read, up to a specific message ID. A failed send preserves the draft; before retrying after a network failure, check whether the original message arrived. There is no automatic resend. WebSockets, attachments, group chats, blocking and message deletion are outside this first version.

## Verification

From `backend`, run the isolated service and HTTP/security tests:

```powershell
mvn.cmd "-Dtest=FollowServiceImplTest,FollowControllerTest" test
```

Message HTTP/security tests (no database):

```powershell
mvn.cmd "-Dtest=MessageControllerTest" test
```

For real PostgreSQL tests, explicitly select a **local/test** database and credentials in the terminal, then run:

```powershell
$env:FOLLOW_TEST_DATABASE_URL = 'jdbc:postgresql://localhost:5432/twitterdb'
$env:FOLLOW_TEST_DATABASE_USERNAME = 'postgres'
$env:FOLLOW_TEST_DATABASE_PASSWORD = 'YOUR_LOCAL_DATABASE_PASSWORD'
mvn.cmd "-Dtest=FollowRepositoryIntegrationTest" test
```

With the same test database environment variables, run message service/repository integration tests:

```powershell
mvn.cmd "-Dtest=MessageIntegrationTest" test
```

Message tests use a separate random `message_test_*` schema, with the same cleanup strategy. They cover participant authorization for all conversation operations, reverse-pair reuse, unread/read boundaries, cursor pagination, inbox privacy and user-deletion cleanup.

The integration suite creates a randomly named `follow_test_*` schema, qualifies entity tables with that schema, rolls back test data and drops its schema on normal context shutdown. It does not use the application's `public` tables. The database user needs permission to create schemas. Without `FOLLOW_TEST_DATABASE_URL`, these tests are skipped. An interrupted JVM may leave its isolated test schema behind.

The follow integration tests cover duplicate/self-follow rejection, foreign-key enforcement, deletion cleanup in both directions, preservation of unrelated relationships, timestamps, counts and pagination. The original application context test is separate and uses application configuration; the commands above deliberately select only the feature tests.

From `frontend/twitter-api`:

```powershell
npm.cmd run lint
npm.cmd run build
```

Manual browser verification: follow another profile, check both profile counters/lists, reload to verify persistence, then unfollow. The profile and sidebar buttons should stay in sync, and an empty list should show an empty state. Multi-page and network-failure UI behavior need additional browser coverage.

Messaging was manually verified with two local accounts on 2026-09-28: send a message, reload to confirm persistence, sign in as the recipient, verify the unread badges, open the conversation to clear them, send a reply, and return to the sender to verify the reply and read receipt. Both test messages remain in the local conversation. The combined follow/messaging automated run passed 40 tests; frontend lint and production build also passed. Multi-page history, concurrent browser sessions, network failures and mobile layouts still need broader manual coverage.

## Post deletion

Deleting a post or reply erases its content and removes its likes and retweets, while retaining its row and reply links with `deleted=true`. Timelines, profile posts and search exclude deleted posts. A deleted root post keeps a “Bu gönderi silindi” parent preview so replies remain accessible. Deleted replies have no visible placeholder: their surviving children appear under the nearest visible ancestor (or the deleted root), and reply counts match the visible list. This also applies to replies deleted before this update. Deleted posts cannot be edited, liked, retweeted or replied to. Existing replies can still receive interactions. This behavior applies to post deletion; account deletion remains a separate cleanup operation.

With the PostgreSQL test environment variables above, run `mvn.cmd "-Dtest=TweetDeletionIntegrationTest" test` from `backend`. These tests use a random `tweet_test_*` schema and cover nested replies, content removal, interaction cleanup, authorization and rejected interactions after deletion. Run `npm.cmd test` from `frontend/twitter-api` for session and deleted-parent state tests.

Interaction review: like and retweet responses expose user IDs and usernames without email values. Duplicate interaction checks run after acquiring the post lock. Reply panels use the API's viewer-specific like/retweet flags, including nested replies, without a separate likes request per comment. `InteractionControllerTest` covers deletion ownership and anonymous mutations; `TweetDeletionIntegrationTest` also covers interaction privacy, viewer-specific counts/state and reply editing ownership.

The post deletion UI was verified locally on 2026-09-28 by creating a temporary post and reply, deleting the parent, then reloading: the reply remained with the deleted-post placeholder. The test reply was kept for inspection.

## Project background

Blink began as a Workintech backend exercise and was expanded into a full-stack application. The original assignment is preserved in [backend/README.md](backend/README.md).
