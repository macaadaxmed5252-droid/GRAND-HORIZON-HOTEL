# 🏨 Grand Horizon Hotel — Enterprise Backend Management System

A production-grade **Spring Boot 3** REST API for hotel operations: guest authentication, admin-controlled room inventory with image uploads, transactional booking with double-booking prevention, PDF invoice generation, and real-time occupancy analytics — all secured behind stateless JWT authentication with strict role separation.

This backend is designed to be consumed by a separate frontend (React, or any HTTP client) and to be safely cloned, configured, and run locally in minutes.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack & Tools](#tech-stack--tools)
3. [Core Features](#core-features)
4. [Environment Setup & Local Installation](#environment-setup--local-installation)
5. [Complete API Endpoint Reference](#complete-api-endpoint-reference)
6. [Validation Reference Rules](#validation-reference-rules)
7. [Known Gaps & Honest Limitations](#known-gaps--honest-limitations)

---

## Architecture Overview

The application follows a strict layered architecture with a clean separation of concerns:

```
HTTP Request
     │
     ▼
┌─────────────────┐   @Valid / @ModelAttribute + Jakarta Bean Validation
│   Controller     │   REST endpoints, request/response mapping only
└────────┬────────┘
         ▼
┌─────────────────┐   @Transactional business logic
│   Service        │   Interface + Impl pattern for every domain
└────────┬────────┘
         ▼
┌─────────────────┐   Spring Data JPA, custom JPQL for analytics
│   Repository     │   & double-booking prevention
└────────┬────────┘
         ▼
┌─────────────────┐
│   PostgreSQL     │
└─────────────────┘
```

Cutting across every layer:

- **`GlobalExceptionHandler`** (`@RestControllerAdvice`) — the single place every exception in the system is caught, logged via SLF4J, and converted into a structured JSON response. Nothing reaches the client as a raw stack trace, and no exception is allowed to bring down the embedded Tomcat instance.
- **JWT security filter chain** — every request (except the explicitly public ones) is authenticated via a stateless Bearer token before it reaches a controller.
- **Custom validation annotations** — domain-specific constraints (`@UniqueEmail`, `@ValidRoomNumber`, `@ValidCheckInCheckOut`) layered on top of standard Jakarta Bean Validation.

### Package Structure

```
com.grandhorizon.hotelreservationsystem
├── bootstrap/        # AdminSeeder — guarantees a ROLE_ADMIN account exists on startup
├── config/            # SecurityConfig, ApplicationConfig, JwtService,
│                       # JwtAuthenticationFilter, WebConfig (static /uploads/** serving)
├── controller/         # REST controllers — no business logic, only HTTP mapping
├── dto/
│   ├── request/        # Inbound payloads with Jakarta + custom validation annotations
│   └── response/        # Outbound, cycle-free projections (never expose entities directly)
├── entity/             # JPA entities (User, Room, Booking, Invoice) + enums
├── exception/          # Custom RuntimeExceptions + GlobalExceptionHandler
├── repository/          # Spring Data JPA interfaces, custom JPQL for analytics
├── service/
│   └── impl/            # Business logic, @Transactional boundaries
└── validation/
    ├── annotation/       # Custom constraint annotations
    └── validator/         # ConstraintValidator implementations
```

---

## Tech Stack & Tools

| Category | Technology |
|---|---|
| Language | Java (compiled for **Java 17** bytecode via Maven; builds and runs on any JDK 17+, including 21 and 23) |
| Framework | Spring Boot **3.3.1** |
| Security | Spring Security 6.x — stateless JWT authentication (`io.jsonwebtoken` / **jjwt 0.12.5**) |
| Persistence | Spring Data JPA + Hibernate, **PostgreSQL** |
| Validation | Jakarta Bean Validation (Hibernate Validator) + custom `ConstraintValidator` implementations |
| File Handling | `multipart/form-data` uploads written to local disk, served back via a custom static resource handler |
| PDF Generation | OpenPDF 1.3.30 (real invoice PDFs, not mocked) |
| Containerization | Docker Compose (PostgreSQL + pgAdmin) |
| Build Tool | Maven (wrapper included — no local Maven install required) |
| Boilerplate Reduction | Lombok |

---

## Core Features

### 🔐 Strict Role-Based Access Control (RBAC)
Two roles — `ROLE_USER` and `ROLE_ADMIN` — enforced at **two independent layers** for defense in depth:
- **URL-pattern layer** (`SecurityConfig`): path-based rules (`/api/rooms/**` POST/PUT/DELETE, `/api/users/**`, `/api/admin/**` all require `ROLE_ADMIN`; `/api/bookings/**` and `/api/invoices/**` require any authenticated user).
- **Method-annotation layer** (`@PreAuthorize("hasRole('ADMIN')")`): applied directly to the room-deletion and dashboard-stats endpoints, so protection survives even if a URL rule is ever misconfigured.

Every account created through public self-registration is force-assigned `ROLE_USER` — there is no `role` field a client can submit to self-escalate privileges. An `AdminSeeder` component checks on every application startup whether any `ROLE_ADMIN` account exists in the database; if none does, it seeds one automatically with a BCrypt-hashed password, so the system can never boot into a state with zero administrators.

### 🛡️ Fault-Tolerant Bean Validation
Every request DTO enforces precise, regex-backed rules — alphabetic-only names, strong-complexity passwords, alphanumeric room codes — and **no validation failure, database constraint violation, or unexpected runtime exception can crash the server or drop the connection pool**. `GlobalExceptionHandler` catches:
- `MethodArgumentNotValidException` / `ConstraintViolationException` → clean `400` JSON with a `field → message` map
- `DataIntegrityViolationException` (foreign key / unique constraint violations) → `409 Conflict` with a safe, generic message (the raw SQL/constraint detail is logged server-side only, never leaked to the client)
- `DataAccessException` (database connectivity failures) → `503 Service Unavailable`
- Domain-specific conflicts (double-booking, deleting the last admin, deleting a user/room with existing bookings) → dedicated custom exceptions, each mapped to the correct HTTP status
- Anything else → `500` with a generic message, full stack trace logged server-side via SLF4J

The database connection pool (HikariCP) is configured with `initialization-fail-timeout=-1`, meaning the application **starts successfully even if PostgreSQL is temporarily unreachable at boot time**, rather than failing to launch.

### 📊 Real-Time Operation Analytics
`GET /api/admin/dashboard-stats` computes four metrics **fresh from the database on every single call** — nothing is cached, nothing is hardcoded:
- **Total Bookings Today** — bookings *created* within `[today 00:00, tomorrow 00:00)`, computed from `LocalDate.now()` at request time
- **Rooms Available** — total room count minus rooms with a non-cancelled booking spanning today's date, calculated from live booking date ranges rather than a manually-maintained status flag (which would otherwise drift stale)
- **Check-Ins Today** / **Check-Outs Today** — non-cancelled bookings whose `checkInDate` / `checkOutDate` is exactly today

All four are backed by dedicated, indexed JPQL `COUNT` queries in `BookingRepository` — no in-memory filtering of full result sets.

### 📁 Secure File Storage
Room images are uploaded as real files via `multipart/form-data`, not URLs. `FileStorageService`:
- Rejects empty files and anything outside the JPEG/PNG/WEBP/GIF whitelist (`400`)
- Sanitizes the client-supplied filename (strips any path segments) to prevent path-traversal
- Renames every file to `UUID_originalName` before writing to disk, eliminating collisions
- Enforces a 5MB size ceiling (`413` if exceeded)
- Serves saved files back publicly at `/uploads/rooms/<filename>` via a dedicated `WebMvcConfigurer`
- Automatically deletes the old file on update, and on room deletion — no orphaned files accumulate on disk

---

## Environment Setup & Local Installation

### Prerequisites
- **JDK 17 or newer** (17, 21, and 23 all confirmed working)
- **Docker Desktop** (for PostgreSQL — or a manually installed PostgreSQL 14+ instance)
- No local Maven installation needed — the Maven Wrapper (`mvnw` / `mvnw.cmd`) is committed to the repository

### Step 1 — Clone the repository

```bash
git clone <your-repository-url>
cd "Grand Horizon Hotel"
```

### Step 2 — Start PostgreSQL with Docker Compose

The repository ships with a `docker-compose.yml` that provisions PostgreSQL and a pgAdmin web UI:

```bash
docker compose up -d
```

This starts:

| Service | Container | Port | Credentials |
|---|---|---|---|
| PostgreSQL 14 | `grand-horizon-postgres` | `5432` | DB: `grand_horizon_db` · user: `postgres` · password: `GrandHorizon2026` |
| pgAdmin 4 | `grand-horizon-pgadmin` | `5050` | `admin@grandhorizon.com` / `AdminPassword2026` |

Data persists in a named Docker volume (`postgres_horizon_data`) across restarts.

### Step 3 — Configure `src/main/resources/application.properties`

The repository ships with working local defaults — nothing *must* change to run locally against the Docker Compose stack above. Review these keys before deploying anywhere beyond your own machine:

```properties
# Server
server.port=5252

# Database (matches the Docker Compose service above)
spring.datasource.url=jdbc:postgresql://localhost:5432/grand_horizon_db
spring.datasource.username=postgres
spring.datasource.password=GrandHorizon2026
spring.datasource.driver-class-name=org.postgresql.Driver

# JWT
application.security.jwt.secret-key=<a 256-bit key, hex-encoded>
application.security.jwt.expiration=86400000

# File uploads
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB
application.upload.root-dir=uploads
application.upload.rooms-subdir=rooms

# Default admin, seeded only if zero ROLE_ADMIN accounts exist
application.security.default-admin.email=admin@grandhorizon.com
application.security.default-admin.password=Admin@12345
```

> ⚠️ **Production note:** the JWT secret and the default admin's password are committed in plaintext for local development convenience. Before deploying anywhere reachable outside your own machine, override every `application.security.*` key via environment variables (e.g. `APPLICATION_SECURITY_JWT_SECRET-KEY`, `APPLICATION_SECURITY_DEFAULT-ADMIN_PASSWORD`) rather than editing this file in place.

### Step 4 — Build and run

```bash
# macOS / Linux
./mvnw clean spring-boot:run

# Windows (PowerShell or cmd)
mvnw.cmd clean spring-boot:run
```

On first boot against a fresh database, Hibernate creates the schema (`spring.jpa.hibernate.ddl-auto=update`) and `AdminSeeder` logs a line confirming it created the default admin account — log in with `admin@grandhorizon.com` / `Admin@12345` immediately, then change that password.

The API is now live at **`http://localhost:5252`**.

---

## Complete API Endpoint Reference

All request bodies below use `Content-Type: application/json` **unless marked `multipart/form-data`**. All protected endpoints expect `Authorization: Bearer <token>`.

### Authentication — `/api/auth` (Public)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Creates a new account (always `ROLE_USER`) |
| `POST` | `/api/auth/login` | Public | Authenticates and issues a JWT |

<details>
<summary><strong>POST /api/auth/register</strong> — request & response shapes</summary>

**Request body:**
```json
{
  "name": "Ahmed Warsame",
  "email": "ahmed.warsame@example.com",
  "password": "Str0ng@Pass1",
  "phone": "+252611234567"
}
```

**Success response — `201 Created`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "ahmed.warsame@example.com",
  "role": "ROLE_USER",
  "expirationTime": "2026-08-01T10:00:00"
}
```

**Validation failure response — `400 Bad Request`** (e.g. digits in the name, weak password, malformed email):
```json
{
  "status": 400,
  "message": "Validation Failed",
  "errors": {
    "name": "Name must contain only alphabetic characters and spaces",
    "email": "Please provide a valid email address structure",
    "password": "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character",
    "phone": "Please provide a valid phone number format"
  }
}
```
</details>

<details>
<summary><strong>POST /api/auth/login</strong> — request & response shapes</summary>

**Request body:**
```json
{
  "email": "ahmed.warsame@example.com",
  "password": "Str0ng@Pass1"
}
```

**Success response — `200 OK`:** same shape as register's success response above.

**Failure response — `401 Unauthorized`:**
```json
{
  "timestamp": "2026-08-01T10:05:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "path": "/api/auth/login"
}
```
</details>

---

### User Management — `/api/users` (`ROLE_ADMIN` only)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | Lists every registered account (password never included) |
| `DELETE` | `/api/users/{id}` | Admin | Deletes a user by numeric id |
| `DELETE` | `/api/users/email/{email}` | Admin | Deletes a user by email address |

**`GET /api/users` — `200 OK`:**
```json
[
  {
    "id": 2,
    "name": "Ahmed Warsame",
    "email": "ahmed.warsame@example.com",
    "phone": "+252611234567",
    "role": "ROLE_USER",
    "createdAt": "2026-08-01T09:55:12"
  }
]
```

**`DELETE /api/users/{id}` — `204 No Content`** on success. Two guardrails prevent this from ever corrupting data or locking out administration:
- Deleting a user with **any** booking on record (regardless of status) → `409 Conflict`, "Cannot delete '...' - this account has N booking(s) on record..."
- Deleting the **only** remaining `ROLE_ADMIN` account → `409 Conflict`, "...only remaining administrator..."

---

### Room Management — `/api/rooms`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/rooms` | Public | Lists rooms, optionally filtered by `?type=` and/or `?status=` |
| `GET` | `/api/rooms/{id}` | Public | Fetches a single room |
| `POST` | `/api/rooms` | Admin | Creates a room — **`multipart/form-data`** |
| `PUT` | `/api/rooms/{id}` | Admin | Updates a room — **`multipart/form-data`** |
| `DELETE` | `/api/rooms/{id}` | Admin | Deletes a room |

<details>
<summary><strong>POST /api/rooms</strong> — multipart/form-data field reference</summary>

This endpoint does **not** accept raw JSON. Build the request as `multipart/form-data` with these parts:

| Key | Type | Example |
|---|---|---|
| `roomNumber` | Text | `101` |
| `type` | Text | `DELUXE` (one of `SINGLE`, `DOUBLE`, `TWIN`, `DELUXE`, `SUITE`, `FAMILY`) |
| `pricePerNight` | Text | `150.00` |
| `title` | Text | `Deluxe Ocean View Room` |
| `description` | Text | `A spacious room with a king-size bed and private balcony.` |
| `amenities` | Text | repeat this key once per item — `Free WiFi`, `Ocean View`, `Mini Bar`, ... |
| `rating` | Text | `4.8` |
| `image` | **File** | a `.jpg` / `.png` / `.webp` / `.gif`, max 5MB — **required** on create, optional on update |

**Success response — `201 Created`:**
```json
{
  "id": 1,
  "roomNumber": "101",
  "type": "DELUXE",
  "pricePerNight": 150.00,
  "status": "AVAILABLE",
  "title": "Deluxe Ocean View Room",
  "description": "A spacious room with a king-size bed and private balcony.",
  "amenities": ["Free WiFi", "Ocean View", "Mini Bar"],
  "rating": 4.8,
  "imageUrl": "/uploads/rooms/3f1a9c2e-7b4d-4e21-9c3a-9d0a1e2b3c4d_room101.jpg"
}
```

The full, publicly accessible image URL is `http://localhost:5252` + `imageUrl` — no authentication required to view it.
</details>

**`DELETE /api/rooms/{id}` — `204 No Content`** on success, `409 Conflict` if the room still has any booking on record (same proactive-guard pattern as user deletion).

---

### Booking Flow — `/api/bookings` (any authenticated user)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings/book` | User/Admin | Creates a booking for the authenticated caller |
| `GET` | `/api/bookings/{id}` | User/Admin | Fetches a single booking by id |
| `GET` | `/api/bookings/my-bookings` | User/Admin | Lists bookings belonging to the authenticated caller |

<details>
<summary><strong>POST /api/bookings/book</strong> — request & response shapes</summary>

**Request body:**
```json
{
  "roomNumber": "101",
  "checkInDate": "2026-08-10",
  "checkOutDate": "2026-08-14",
  "guestNotes": "Late check-in around 9 PM, extra pillow please."
}
```

The guest is resolved from the JWT — there is no `userId` field. `roomNumber` must reference an existing room; there is no `roomId` field.

**Success response — `201 Created`:**
```json
{
  "id": 1,
  "bookingReference": "GH-BK-000001",
  "room": { "...": "RoomResponse, see above" },
  "guestFullName": "Ahmed Warsame",
  "checkInDate": "2026-08-10",
  "checkOutDate": "2026-08-14",
  "totalNights": 4,
  "totalAmount": 600.00,
  "status": "CONFIRMED"
}
```

**Conflict response — `409 Conflict`** (room already booked for an overlapping date range):
```json
{
  "timestamp": "2026-08-01T10:10:00",
  "status": 409,
  "error": "Conflict",
  "message": "Room 101 is already booked for the selected date range",
  "path": "/api/bookings/book"
}
```
</details>

---

### Invoices — `/api/invoices` (any authenticated user)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/invoices/download/{id}` | User/Admin | Downloads the invoice PDF by **invoice id** (not booking id) |

Returns a binary `application/pdf` body with `Content-Disposition: attachment`. There is currently no endpoint that looks up an invoice's id from its booking id — retrieve it directly from the `invoices` table (`booking_id` column) until such an endpoint exists.

---

### Dashboard Analytics — `/api/admin` (`ROLE_ADMIN` only)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard-stats` | Admin | Real-time operational snapshot |

**Response — `200 OK`:**
```json
{
  "totalBookingsToday": 3,
  "roomsAvailable": 7,
  "checkInsToday": 2,
  "checkOutsToday": 1
}
```

---

## Validation Reference Rules

| Field | Applies To | Rule | Annotation |
|---|---|---|---|
| `name` | Register | Letters and spaces only, 3–50 characters | `@Pattern` + `@Size(min = 3, max = 50)` |
| `email` | Register | Well-formed **and** not already registered | `@Email` + custom `@UniqueEmail` (live database lookup) |
| `password` | Register | Min 8 characters; at least one uppercase, one lowercase, one digit, one special character | `@Pattern` |
| `phone` | Register | Somali mobile (`+252` then `6X`/`9X` + 7 digits) **or** general E.164 international format | `@Pattern` |
| `email` | Login | Well-formed only (no uniqueness check — this is a login, not a registration) | `@Email` |
| `roomNumber` | Room create/update | 2–20 characters; letters, digits, and hyphens only; never a single digit | `@Pattern` |
| `pricePerNight` | Room create/update | Strictly greater than zero | `@DecimalMin(value = "0.01")` |
| `title` | Room create/update | Optional; when present, must start with a letter (not a digit) | `@Pattern` |
| `roomNumber` | Booking | Must reference a room that actually exists | custom `@ValidRoomNumber` (live database lookup) |
| `checkInDate` / `checkOutDate` | Booking | Both today or later; check-in strictly before check-out | custom class-level `@ValidCheckInCheckOut` |
| `image` | Room create/update | Non-empty; JPEG/PNG/WEBP/GIF only; max 5MB | Enforced in `FileStorageService`, not a Bean Validation annotation |

### Exact regex patterns

The runtime regex value for every `@Pattern` above (not the Java source's double-escaped string literal):

```
name          ^[a-zA-Z\s]+$
password      ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!()_\-{}\[\]:;"'<>,.?/~`|\\]).{8,}$
phone         ^(\+252(6[0-9]|9[0-9])\d{7}|\+[1-9]\d{7,14})$
roomNumber    ^[A-Za-z0-9-]{2,20}$
title         ^[A-Za-z][A-Za-z0-9\s'-]*$
```

Every validation failure above returns:

```json
{
  "status": 400,
  "message": "Validation Failed",
  "errors": { "<field>": "<human-readable message>" }
}
```

---

## Known Gaps & Honest Limitations

Documented here deliberately, rather than silently glossed over, so nothing in this README misleads a consumer of the API:

- **No admin-wide booking list.** There is no `GET /api/bookings` that returns every booking across all guests — only `GET /api/bookings/my-bookings` (scoped to the caller) and `GET /api/bookings/{id}` (single lookup) exist today.
- **No booking status-update endpoint.** There is no `PUT /api/bookings/{id}/status` — a booking's status is set once at creation time (`CONFIRMED`) and is never subsequently changed by any endpoint. Cancelling or otherwise transitioning a booking's status is not currently exposed via the API.
- **No endpoint exposes an invoice's id from its booking.** See the Invoices section above.
- **`GET /api/bookings/{id}` has no ownership check.** Any authenticated user — not just the booking's owner — can currently fetch any booking by id, since only `/my-bookings` is scoped to the caller.

None of these were in scope for the work already completed; they're listed here so this README stays accurate rather than aspirational.
