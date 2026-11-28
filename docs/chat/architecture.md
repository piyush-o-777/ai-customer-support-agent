# Chat Feature - Design Document

## 1. Problem Statement
Authenticated users need an AI-powered customer support chat interface with persistent, user-isolated conversation history backed by MongoDB and Hugging Face inference.

---

## 2. Terminologies
* **Conversation:** A user-owned chat thread grouping ordered messages.
* **Message:** A single `"user"` or `"assistant"` entry linked to a `Conversation`.
* **Context Window:** Last `N` messages sent to the AI model alongside the system prompt to bound token usage.
* **Hugging Face Inference:** OpenAI-compatible chat completions API (`https://router.huggingface.co/v1/chat/completions`) powered by `HF_API_KEY` / `AI_API_KEY`.
* **Ownership Check:** Querying conversations by `{ _id, userId: req.userId }` to block cross-user access.

---

## 3. Entities

### Conversation
* `id` (database unique key)
* `userId` (`ObjectId`, indexed ref to `User`)
* `title` (`String`, default `"New Conversation"`, auto-set from first user prompt)
* `createdAt` (timestamp)
* `updatedAt` (timestamp)

### Message
* `id` (database unique key)
* `conversationId` (`ObjectId`, indexed ref to `Conversation`)
* `userId` (`ObjectId`, indexed ref to `User`)
* `role` (`"user" | "assistant"`)
* `content` (`String`, required)
* `createdAt` (timestamp)

---

## 4. Entities Relations
* One `User` owns zero or many `Conversation` documents (`Conversation.userId` references `User._id`).
* One `Conversation` contains zero or many `Message` documents (`Message.conversationId` references `Conversation._id`).
* Separate `messages` collection avoids MongoDB's 16 MB document limit and enables fast pagination.
* Security boundary: All `/chat/*` routes require `authMiddleware` and derive `userId` exclusively from `req.userId`.

---

## 5. Approach

### What We Are Going to Do
* Protect all `/chat/*` routes with `authMiddleware` and enforce ownership checks on every query.
* Add dedicated rate limiting on `POST /chat/conversations/:id/messages` to protect AI quota.
* Wrap Hugging Face Router API in `aiService.ts` with a customer-support system prompt, last `N` messages context, timeout, and `502`/`503` error mapping.
* Auto-generate conversation title from the first user message if still default.
* Cascade-delete all messages when deleting a conversation.

### What We Are Going to Store and Why
* **MongoDB (`conversations`):** Thread metadata (`userId`, `title`, timestamps) for fast sidebar listing sorted by `updatedAt` desc.
* **MongoDB (`messages`):** Individual chat turns (`conversationId`, `userId`, `role`, `content`, `createdAt`) indexed by `{ conversationId, createdAt }`.

### Pros and Cons for Production
* **Pros:**
  * Scales beyond MongoDB's 16 MB document cap.
  * Strict per-user isolation via JWT-derived `userId`.
  * Provider-agnostic OpenAI-compatible wrapper (defaults to Hugging Face, easy to swap).
* **Cons:**
  * Non-streaming JSON replies have higher perceived latency on long generations (SSE can be added later).
  * External AI latency/outages directly impact message send times.

---

## 6. APIs

### 1. Create Conversation
* **Path:** `/chat/conversations`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <jwt>`, `Content-Type: application/json`
* **Payload:**
```json
{
    "title": "Order refund help"
}
```
* **Response Status Codes:**
  * `201 Created`:
```json
{
    "conversation": {
        "id": "...",
        "title": "Order refund help",
        "createdAt": "...",
        "updatedAt": "..."
    }
}
```
* **Reject Status Codes:** `401 Unauthorized`, `500 Internal Server Error`

### 2. List Conversations
* **Path:** `/chat/conversations`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <jwt>`
* **Response Status Codes:**
  * `200 OK`:
```json
{
    "conversations": [
        {
            "id": "...",
            "title": "Order refund help",
            "createdAt": "...",
            "updatedAt": "..."
        }
    ]
}
```
* **Reject Status Codes:** `401 Unauthorized`, `500 Internal Server Error`

### 3. Get Conversation Messages
* **Path:** `/chat/conversations/:id/messages`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <jwt>`
* **Response Status Codes:**
  * `200 OK`:
```json
{
    "messages": [
        {
            "id": "...",
            "conversationId": "...",
            "role": "user",
            "content": "Where is my order?",
            "createdAt": "..."
        }
    ]
}
```
* **Reject Status Codes:** `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

### 4. Send Message
* **Path:** `/chat/conversations/:id/messages`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <jwt>`, `Content-Type: application/json`
* **Payload:**
```json
{
    "content": "How do I request a refund?"
}
```
* **Response Status Codes:**
  * `201 Created`:
```json
{
    "userMessage": {
        "id": "...",
        "conversationId": "...",
        "role": "user",
        "content": "How do I request a refund?",
        "createdAt": "..."
    },
    "assistantMessage": {
        "id": "...",
        "conversationId": "...",
        "role": "assistant",
        "content": "...",
        "createdAt": "..."
    }
}
```
* **Reject Status Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `429 Too Many Requests`, `502 Bad Gateway`, `503 Service Unavailable`, `500 Internal Server Error`

### 5. Delete Conversation
* **Path:** `/chat/conversations/:id`
* **Method:** `DELETE`
* **Headers:** `Authorization: Bearer <jwt>`
* **Response Status Codes:**
  * `200 OK`:
```json
{
    "message": "Conversation deleted"
}
```
* **Reject Status Codes:** `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`
