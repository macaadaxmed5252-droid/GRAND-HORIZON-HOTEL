# Grand Horizon Hotel — Enterprise Management Suite

A full-stack hotel operations platform built to replace spreadsheet-and-notebook front desk management with a real system of record: room inventory, reservations, guest check-in/check-out, invoicing, and revenue reporting behind a single authenticated API. The suite ships as coordinated containers — a Spring Boot REST backend, a PostgreSQL data store, a pgAdmin console, and a React SPA — orchestrated with Docker Compose so the whole stack comes up with one command on any machine that has Docker installed.

This is not a toy CRUD demo. It carries a stateless JWT security layer, Jakarta Bean Validation with custom cross-field validators, a centralized exception-handling advice, and — the detail that actually mattered in production — soft deletion on the entities that back financial reporting, so archiving a guest account or retiring a room doesn't take historical revenue with it.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Feature Matrix](#feature-matrix)
4. [Core Technical Deep-Dives](#core-technical-deep-dives)
5. [Local Quick Start Guide (Docker Compose)](#local-quick-start-guide-docker-compose)

---

## Project Overview

| Layer | Technology | Role |
|---|---|---|
| **Backend** | Spring Boot 3, Java 21 | REST API, business logic, transactional boundary |
| **Security** | Spring Security, `io.jsonwebtoken` (JJWT), BCrypt | Stateless authentication, path-based authorization |
| **Persistence** | Spring Data JPA / Hibernate | ORM, repository abstraction, entity lifecycle hooks |
| **Database** | PostgreSQL 14 | Durable relational store, referential integrity enforcement |
| **Frontend** | React 19, Vite | Single-page application, component-driven UI |
| **Styling** | Tailwind CSS 4 (`@tailwindcss/vite`) | Utility-first, fluid responsive layout system |
| **Routing** | React Router DOM 7 | Client-side route tree, nested layout shells, route guarding |
| **Data Visualization** | Recharts | Revenue trend, occupancy trend, room-type distribution charts |
| **Containerization** | Docker, Docker Compose | Reproducible multi-service orchestration, bridge networking |

The backend exposes a REST surface under `/api/**`; the frontend never talks to Postgres directly and has no server-side rendering step — it is a pure SPA that authenticates once, caches a bearer token, and attaches that token to every subsequent call until it expires or the user logs out.

---

## Architecture & Data Flow

```
┌────────────────────────────────┐        HTTPS / JSON         ┌───────────────────────────────────┐
│   TIER 1 — PRESENTATION         │  ────  Bearer <JWT>  ─────▶ │   TIER 2 — LOGIC                    │
│   React 19 SPA (Vite)           │                              │   Spring Boot 3 REST API             │
│   container:host  5173:5173     │  ◀── JSON / 4xx / 5xx ────  │   container:host  5252:5252          │
│                                  │                              │                                       │
│   Router → Layout → Page        │                              │   Controller  (DTO in / DTO out)     │
│   AuthContext (JWT cache)       │                              │        ↓                              │
│   ProtectedRoute (guard)        │                              │   Service     (business rules,        │
│   Fetch-based API client        │                              │                state transitions)     │
│   (auto-attaches token,         │                              │        ↓                              │
│    normalizes ApiError)         │                              │   Repository  (Spring Data JPA)       │
└────────────────────────────────┘                              │        ↓                              │
                                                                  │   Hibernate / JDBC driver              │
                                                                  └───────────────┬───────────────────────┘
                                                                                  │ SQL over TCP :5432
                                                                                  │ (service-name DNS: postgres-db)
                                                                                  ▼
                                                                  ┌───────────────────────────────────┐
                                                                  │   TIER 3 — DATA ISOLATION            │
                                                                  │   PostgreSQL 14                      │
                                                                  │   database: grand_horizon_db          │
                                                                  │   named volume: postgres_horizon_data │
                                                                  │   reachable only inside the bridge    │
                                                                  │   network — no public ingress         │
                                                                  └───────────────────────────────────┘
```

Every write path funnels through the same three layers before it touches a row: **Controller** (request/response shape only, zero business logic) → **Service** (validation, ownership checks, state transitions like `PENDING → CONFIRMED`) → **Repository** (Spring Data JPA query methods, dynamic filtering for search/reporting endpoints). Nothing above the service layer ever sees a raw Hibernate entity — DTOs are mapped at the controller boundary specifically so a Jackson serialization change, or a lazy-loading proxy on an association, can never leak into a JSON response.

Authentication is stateless by design: no server-side session, no sticky-session load balancer requirement, no session replication concern in a multi-instance deployment. `JwtAuthenticationFilter` runs once per request, ahead of Spring Security's own `UsernamePasswordAuthenticationFilter`, resolves the principal directly off the token's signature and claims, and drops it into the `SecurityContextHolder` for that single request's thread only — nothing persists between requests.

---

## Feature Matrix

### Backend engines

| Engine | What it does | Why it's built this way |
|---|---|---|
| **JWT authentication filter chain** | A single `OncePerRequestFilter` validates the `Authorization: Bearer` header, loads `UserDetails`, verifies signature/expiry/account status before any controller method executes. | Keeps authentication resolution out of every individual controller — one filter, one place to audit, zero chance of a forgotten check on a new endpoint. |
| **Path-based authorization** | Centralized in `SecurityConfig` (`hasAuthority("ROLE_ADMIN")`, `authenticated()`, `permitAll()`), layered with method-level `@PreAuthorize` on sensitive admin endpoints as defense in depth. | Authorization rules live in one file, not scattered as annotations across dozens of controller methods where a missing one is easy to miss in review. |
| **Soft-delete data retention** | `User` and `Room` carry an `is_deleted` boolean flipped by Hibernate's `@SQLDelete` annotation instead of a physical `DELETE`. | A deleted guest account's or a decommissioned room's historical bookings, invoices, and revenue rows stay fully resolvable — nothing downstream ever null-checks a foreign key pointing at a row that no longer exists. |
| **Deliberate absence of a global `@Where` filter** | Active-only listings (admin guest search, available-room search) filter `is_deleted = false` explicitly at the query level, never through Hibernate's blanket entity-level `@Where` clause. | A global filter silently breaks lazy-loading a soft-deleted guest's *own* historical bookings — see the [Soft Delete deep-dive](#1-soft-delete-without-where-the-pitfall-that-almost-happened) below. |
| **Jakarta Bean Validation + custom validators** | Beyond `@NotNull`/`@Email`, the domain ships `@StrongPassword`, `@ValidPhoneNumber`, `@ValidCheckInCheckOut`, `@ValidPaymentDetails`, `@ValidRoomNumber`, `@UniqueEmail`. | Cross-field and business-rule validation happens declaratively on the DTO, not buried inside service-layer `if` chains that are easy to forget to update. |
| **Centralized exception handling** | A single `@RestControllerAdvice` translates every domain and infrastructure exception into a consistent JSON envelope with an HTTP status and a machine-readable `errorCode`. | No stack trace ever reaches a client response; the frontend can branch on `errorCode` instead of parsing message strings. |
| **Invoice generation & PDF storage** | Completed bookings generate an invoice record with tax/grand-total breakdown and a stored PDF, retrievable via an authenticated binary download endpoint. | Financial documents are generated server-side once, from authoritative data, and persisted — not recomputed client-side from data the client could tamper with. |

### Frontend highlights

| Feature | What it does | Why it matters |
|---|---|---|
| **"Today's Reservations" live grid** | A paginated, searchable table on the admin dashboard surfacing every booking active for the current date, with colored initial-letter avatar nodes, status pill badges, and row-level View/Edit modal actions. | Gives front desk staff a single, glanceable, filterable view of today's arrivals/departures without a page navigation per lookup — see the [deep-dive](#2-todays-reservations-grid-avatars-badges-and-scroll-safe-modals) below. |
| **Role-gated route guarding** | `ProtectedRoute` wraps both guest-facing pages (`/dashboard`, `/reserve`, `/settings`) and the entire `/admin/*` subtree. | Unauthenticated or under-privileged users are redirected before a protected page ever renders — no flash of protected content. |
| **Centralized API client** | A fetch-based client attaches the cached bearer token to every outgoing request and normalizes the backend's two error shapes into one `ApiError` type. | The rest of the app branches on `err.errorCode`, never on parsing a message string — resilient to copy changes on the backend. |
| **Recharts dashboards** | Month-to-Date revenue trend, occupancy trend, and room-type distribution, reshaped client-side from the pre-aggregated admin summary payload. | Presentation-layer reshaping only — the backend already computed the correct, soft-delete-aware aggregate. |
| **Fluid Tailwind CSS 4 layouts** | Rigid fixed-pixel `max-width` clamps were eliminated in favor of adaptive grid/flex structures. | Dashboards and charts scale correctly from a laptop viewport through an ultrawide monitor with no clipping — see the [deep-dive](#3-fluid-layout-engineering-killing-the-fixed-width-clamp) below. |
| **Toast + skeleton + empty/error states** | Every data-fetching view has a loading skeleton, an explicit empty state, and an explicit error state. | No view is ever left silently rendering `undefined` or a blank div while data loads or a request fails. |

---

## Core Technical Deep-Dives

### 1. Soft Delete without `@Where` — the pitfall that almost happened

`User` and `Room` are annotated with Hibernate's `@SQLDelete`:

```java
@SQLDelete(sql = "UPDATE users SET is_deleted = true WHERE id = ?")
public class User implements UserDetails { ... }

@SQLDelete(sql = "UPDATE rooms SET is_deleted = true WHERE id = ?")
public class Room { ... }
```

Calling `repository.delete(entity)` anywhere in the codebase never issues a physical `DELETE`. Hibernate intercepts the delete lifecycle event and rewrites it into the `UPDATE` above, flipping `is_deleted` to `true`. Every `Booking` row referencing that `user_id` or `room_id` keeps a permanently resolvable foreign key — a revenue aggregate (`SUM(total_amount)`) joined through either association never has to null-coalesce around a row that vanished, and a **Month-to-Date revenue dashboard card cannot silently reset to `$0.00`** just because a guest account was archived or a room was retired mid-month.

The part that separates this from a boilerplate soft-delete tutorial is what's **deliberately not there**: neither entity carries Hibernate's companion `@Where(clause = "is_deleted = false")` filter. That filter, if applied, would not just hide archived rows from listing queries — it applies globally, to *every* load of the entity, including when Hibernate resolves it as the lazy-loaded far side of an association. Concretely: `booking.getUser()` on a booking that belongs to a since-archived guest would silently fail to resolve, because Hibernate would apply the `is_deleted = false` predicate to that lazy fetch too — corrupting the exact revenue and booking-history reporting this pattern exists to protect, just relocated one join deeper where it's harder to notice in testing.

The correct fix, applied here, is to keep `@SQLDelete` and skip `@Where` entirely. "Active only" semantics are applied **explicitly, at the query layer**, only on the specific listing endpoints that need them:

```java
// Admin "active guests" search — explicit filter, scoped to this query only
List<User> findByIsDeletedFalseAndNameContainingIgnoreCase(String name);

// Available-room search — same pattern, scoped to this query only
List<Room> findByIsDeletedFalseAndStatus(RoomStatus status);
```

Every other code path — including `booking.getUser()`, `booking.getRoom()`, and any revenue/occupancy aggregate joined through those associations — resolves the entity exactly as it exists, active or archived, because nothing is silently filtering it out underneath the ORM.

As a second line of defense, `User.isEnabled()` (the `UserDetails` contract method Spring Security's `DaoAuthenticationProvider` checks immediately after password verification) returns `!isDeleted`. A soft-deleted account is rejected at authentication time with a standard `DisabledException` — no separate filtering logic required in the login path, and the same flag that protects financial reporting also gates login.

### 2. "Today's Reservations" grid — avatars, badges, and scroll-safe modals

The admin dashboard's centerpiece is a live, paginated grid surfacing every booking whose stay window is active on the current date (`checkInDate <= today <= checkOutDate`, excluding cancellations), built entirely with React state — no external grid library.

- **Deterministic colored avatar nodes.** Each guest's initial is rendered inside a circular badge colored by hashing the guest's name into an index against a fixed navy/gold palette:

  ```js
  function avatarColorFor(name) {
    const sum = (name || "?").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
  }
  ```

  The same guest name always resolves to the same color, on every render and every page reload, with nothing persisted to a database — the color is a pure function of the string.

- **Status badge matrix.** The backend's `BookingStatus` enum only tracks `PENDING` / `CONFIRMED` / `CANCELLED`; check-in and check-out are separate timestamp fields (`checkedInAt`, `checkedOutAt`), not additional enum values. The grid derives a four-state *display* status client-side:

  ```js
  function deriveDisplayStatus(booking) {
    if (booking.checkedOutAt) return "CHECKED_OUT";
    if (booking.checkedInAt)  return "CHECKED_IN";
    if (booking.status === "CONFIRMED") return "CONFIRMED";
    return "PENDING";
  }
  ```

  Each derived state maps to its own pill badge style, so the grid reads as four visually distinct lifecycle stages even though the backend only persists three raw states.

- **Text query filters.** Search input filters the currently loaded reservation set live, character by character — no separate "submit search" step, no round-trip per keystroke.

- **Scroll-safe modal sheet actions.** Selecting a row's View/Edit action opens a `Modal` in place rather than navigating to a separate route. This is a deliberate front-desk usability decision, not a cosmetic one: an operator working through a queue of same-day arrivals edits one booking, dismisses the modal, and lands back at the exact same scroll position and page of the paginated grid — a full-page navigation would reset that position and force them to re-locate their place in a list that can run to dozens of rows during a busy check-in window.

### 3. Fluid layout engineering — killing the fixed-width clamp

Early admin dashboard layouts were built against rigid, fixed-pixel container widths tuned by eye against a standard laptop viewport. On an ultrawide or large desktop monitor, two failure modes appeared simultaneously: fixed-width containers stranded the entire dashboard as a narrow column in the middle of the screen, while charts and cards that mixed a fixed pixel width with percentage-based children produced clipped Recharts containers and uneven card wrapping that never reproduced on a laptop screen.

The fix systematically replaced every fixed-width utility with Tailwind's fluid primitives:

| Before (fixed) | After (fluid) | Effect |
|---|---|---|
| `w-[1024px]` | `w-full max-w-screen-2xl mx-auto` | Container scales with the viewport up to a sane ceiling, then centers — never clamps to a hard pixel value that strands content on a wide screen. |
| Manually tuned pixel margins between cards | `flex flex-wrap gap-6` / `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6` | Cards reflow their column count by breakpoint instead of overflowing or leaving dead space. |
| Chart wrapper with a fixed `width`/`height` | Recharts `<ResponsiveContainer width="100%" height={...}>` inside a fluid parent | Charts resize with their container instead of clipping at a hardcoded pixel boundary on wider viewports. |

The result is a dashboard that holds its layout — no horizontal scroll, no chart clipping, no orphaned narrow column — from a laptop viewport through an ultrawide desktop monitor, without a single breakpoint-specific layout having to be hand-authored for each screen class.

### 4. Global Exception Advice — one envelope, every failure

`GlobalExceptionHandler`, a single `@RestControllerAdvice`, is the only place in the codebase permitted to translate an exception into an HTTP response:

```json
// Validation failure (400)
{
  "success": false,
  "status": 400,
  "message": "Validation Failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": { "email": "must be a well-formed email address" }
}

// Domain conflict (409)
{
  "success": false,
  "status": 409,
  "error": "Conflict",
  "errorCode": "ROOM_ALREADY_BOOKED",
  "message": "Room 204 is already booked for the requested date range",
  "path": "/api/bookings"
}
```

`MethodArgumentNotValidException` and `ConstraintViolationException` are flattened into a `{field: message}` map under `VALIDATION_ERROR`. Domain exceptions — `ResourceNotFoundException` (404), `RoomAlreadyBookedException` / `InvalidBookingDatesException` (409/400), `LastAdminException` (blocks removing the last remaining admin account), `FileStorageException` / `InvalidFileException` — each map to a specific status and a stable `errorCode`. Infrastructure exceptions (`DataIntegrityViolationException`, `MaxUploadSizeExceededException`, `AuthenticationException`) are caught the same way, so a database constraint violation or an oversized upload never surfaces as a raw stack trace or an opaque `500`. Every branch is logged at a severity matched to what actually happened — client mistakes at `WARN`, not `ERROR` — and every response, success or failure, shares the same envelope shape, which is exactly the contract the frontend's API client relies on to normalize both error shapes into one `ApiError` without ever string-matching on `message` text.

---

## Local Quick Start Guide (Docker Compose)

**Prerequisites:** Docker Desktop (or Docker Engine + Compose plugin) running locally. No local JDK, Node, or Postgres install required — everything builds and runs inside containers.

```bash
# from the repository root, next to docker-compose.yml
docker compose up --build -d
```

This builds and starts four services on a shared, user-defined `horizon-network` **bridge** network, which gives every container DNS-based service discovery by container/service name:

| Service | Container name | Host port → Container port | Purpose |
|---|---|---|---|
| `postgres-db` | `grand-horizon-postgres` | `5432 → 5432` | PostgreSQL 14 data store; data persisted in named volume `postgres_horizon_data` |
| `pgadmin` | `grand-horizon-pgadmin` | `5050 → 80` | Web-based Postgres administration console |
| `backend-api` | `grand-horizon-backend` | `5252 → 5252` | Spring Boot REST API, multi-stage Maven → JRE build |
| `frontend-app` | `grand-horizon-frontend` | `5173 → 5173` | React SPA served via the Vite dev server |

### Service-name routing — why this matters and where it's easy to get backwards

Two different environment variables in `docker-compose.yml` point at "the other service," and they deliberately use **different hostnames** because they're resolved by different processes in different network contexts:

```yaml
backend-api:
  environment:
    # Resolved by the JVM inside the backend container, on the bridge network.
    # "postgres-db" is the Postgres service's Compose service name — Docker's
    # embedded DNS resolves it only for containers on the same network.
    SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-db:5432/grand_horizon_db

frontend-app:
  environment:
    # Resolved by the user's BROWSER, running on the host machine — outside
    # Docker's network namespace entirely. "backend-api" would mean nothing
    # to it; only the host-mapped port is reachable from there.
    VITE_API_BASE_URL: http://localhost:5252
```

If these were swapped, both connections would fail silently in different ways: the backend targeting `localhost` for its datasource would try to connect to Postgres *inside its own container*, where nothing is listening — `localhost` inside a container never refers to a sibling container. The frontend targeting `backend-api` for its API base would produce a request the browser can never resolve, since that hostname only exists inside the Compose network's internal DNS, not on the host's DNS resolution path.

Once all four containers report healthy:

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API base:** [http://localhost:5252/api](http://localhost:5252/api)
- **pgAdmin:** [http://localhost:5050](http://localhost:5050)

A default `ROLE_ADMIN` account is seeded on first boot (see `AdminSeeder` / `application.properties` for the seeded credentials, or override them via environment variables before `up`).

**Useful follow-ups:**

```bash
# Tail logs from a single service
docker compose logs -f backend-api

# Rebuild just one service after a code change
docker compose up --build -d backend-api

# Stop everything, keep data volumes
docker compose down

# Stop everything and drop the database volume (destructive)
docker compose down -v
```

Uploaded room images and guest avatars persist across container rebuilds via the `hotel_upload_assets` named volume — without it, every `--build` would start the backend from a fresh writable layer and silently drop every previously uploaded file. The Postgres data volume is deliberately pinned to a fixed name (`grandhorizonhotel-backend_postgres_horizon_data`) rather than left to Compose's project-name-derived default, so relocating the compose file never orphans an already-populated database under a differently named volume.
