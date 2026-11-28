# Authentication Feature - Design Document

## 1. Problem Statement
Our AI Customer Support Agent needs a secure, stateless authentication system so that only registered users can access the chat APIs. User passwords must never be stored in plaintext, every protected API request must reliably identify the logged-in users to keep chat histories isolated per user, and the system must defend the user's chat data and history as well. 

---

## 2. Terminologies

- **JWT (JSON Web Token):** - a unique token for identification of the client's request (this contains crucial meta data, expiry in encrypted form)

- **bcrypt:** - A password-hashing algorithm in order to make client's credentials safe and unreadable / undetectable. 

- **Auth Middleware:** - An Express middleware function placed in front of protected routes. It extracts and verifies the JWT, rejects invalid or expired tokens with `401 Unauthorized`. 

- **Protected Route:** - a routes needs protection to prevent unauthorized access to page / data of the user if that user is not logged in 

* **Rate Limiting:** Restricting how many requests a single IP address can make to `/auth/*` within a given time window (using `express-rate-limit`) to block heavy access within time frame 
---

## 3. Entities

### User 

* `id` (database's side unqiue key)
* `name` (name of the user)
* `email` (unique user's account creation identifier)
* `passwordHash` ((`String`, required): `bcrypt` hash of the user's password)
* `createdAt` (timestamp when the account was created)
* `updatedAt` (timestamp when the account was last updated)
* `is_active` (whether user's account is active or deactivated)


### AuthTokenPayload (Ephemeral, encoded inside JWT, not stored in DB)

* `userId` (`String`): Stringified `User.id`.
* `iat` (`Number`): issued at 
* `exp` (`Number`): expires at 

---

## 4. Entities Relations

* `User` is the root identity entity in the system.
* One `User` can have zero or many active stateless JWTs at the same time (for example, logged in across multiple browsers or devices) until each token expires.
* Downstream entities in future features (`Conversation` and `Message`) will reference `User._id` via a `userId` field.
* Security boundary: Protected routes always derive `userId` from the verified JWT (`req.userId`), never from the request body or query parameters.

---

## 5. Approach

### What We Are Going to Do
* Stateless JWT auth in Node.js + Express with MongoDB Atlas.
* **Signup:** Normalize email, hash password (`bcrypt`), save user, return JWT.
* **Login:** Verify email + `bcrypt` password, return JWT.
* **Middleware:** `authMiddleware` validates `Bearer <token>` and sets `req.userId`.
* **Security:** Rate-limit `/auth/*` (`express-rate-limit`); fail fast if `MONGO_URI` or `JWT_SECRET` is missing.
* **Logout:** Client clears stored JWT (optional `/auth/logout` call).

### What We Are Going to Store and Why
* **MongoDB (`users`):** `name`, unique normalized `email`, salted `bcrypt` `passwordHash` (never plaintext), timestamps.
* **JWT (client-side):** Minimal payload (`userId`, `iat`, `exp`), signed and not encrypted.
* **Not in DB:** Sessions/tokens, keeping auth stateless with zero DB lookups per request.

### Pros and Cons for Production
* **Pros:**
  * Easy horizontal scaling (no shared session store).
  * Fast auth (in-memory signature check, no DB calls).
  * Simple to build and test.
  * Solid baseline security (`bcrypt`, rate limiting, generic login errors).
* **Cons:**
  * **No instant revocation:** Tokens stay valid until `exp` without a blocklist or refresh-token flow.
  * **Storage trade-off:** `localStorage` is exposed to XSS; production should use `httpOnly`, `Secure`, `SameSite` cookies.
  * **CPU load:** `bcrypt` is CPU-heavy under login spikes.
  * **Secret rotation:** Changing `JWT_SECRET` invalidates all active tokens unless `kid` rotation is added.

---

## 6. APIs

### 1. User Signup
* **Description:** Registers a new user account, hashes the password, and returns an auth token.
* **Path:** `/auth/signup`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Params:** None
* **Payload:**
```json
{
    "name": "piyush",
    "email": "piyush@example.com",
    "password": "strongPassword123"
}
```
* **Response Status Codes:**
  * `201 Created`: Account created; returns:
```json
{
    "token": "<jwt>",
    "user": {
        "id": "...",
        "name": "piyush",
        "email": "piyush@example.com"
    }
}
```
* **Reject Status Codes:**
  * `400 Bad Request`: Missing required fields, invalid email format, or password shorter than 8 characters
  * `409 Conflict`: Email is already registered
  * `429 Too Many Requests`: Rate limit exceeded
  * `500 Internal Server Error`: Unexpected database or server error

### 2. User Login
* **Description:** Authenticates an existing user with email and password and returns an auth token.
* **Path:** `/auth/login`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Params:** None
* **Payload:**
```json
{
    "email": "piyush@example.com",
    "password": "strongPassword123"
}
```
* **Response Status Codes:**
  * `200 OK`: Login successful; returns:
```json
{
    "token": "<jwt>",
    "user": {
        "id": "...",
        "name": "piyush",
        "email": "piyush@example.com"
    }
}
```
* **Reject Status Codes:**
  * `400 Bad Request`: Missing email or password
  * `401 Unauthorized`: Invalid email or password (always generic)
  * `429 Too Many Requests`: Rate limit exceeded
  * `500 Internal Server Error`: Unexpected database or server error

### 3. Get Current User
* **Description:** Returns the profile of the currently authenticated user and verifies token validity.
* **Path:** `/auth/me`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <jwt>`
* **Params:** None
* **Payload:** None
* **Response Status Codes:**
  * `200 OK`: Token valid; returns:
```json
{
    "user": {
        "id": "...",
        "name": "Piyush",
        "email": "piyush@example.com"
    }
}
```
* **Reject Status Codes:**
  * `401 Unauthorized`: Missing, malformed, invalid, or expired JWT
  * `404 Not Found`: User referenced by token no longer exists
  * `500 Internal Server Error`: Unexpected database or server error

### 4. User Logout

* **Description:** Acknowledges user logout (stateless; client discards the JWT).
* **Path:** `/auth/logout`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <jwt>`
* **Params:** None
* **Payload:** None
* **Response Status Codes:**
  * `200 OK`: Logout acknowledged; returns:
```json
{
    "message": "Logged out successfully"
}
```
* **Reject Status Codes:**
  * `401 Unauthorized`: Missing or invalid JWT

---

