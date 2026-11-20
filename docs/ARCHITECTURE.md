# Lexa Trip Architecture & Swarm Specification

## 1. System Overview & Architectural Philosophy

The Lexa Trip Social Media Automation System is an enterprise-grade autonomous content publishing platform engineered for multi-destination travel hospitality brands. The platform bridges multimodal AI generation, search engine optimization (SEO), anti-spam scheduling, multi-platform API publishing, and real-time operational telemetry into a unified architecture.

```
+---------------------------------------------------------------------------------------------------+
|                                 LEXA TRIP MULTI-AGENT PIPELINE                                    |
+---------------------------------------------------------------------------------------------------+
|  [ Content Input ]         [ AI Engine ]              [ SEO Generator ]        [ QA Engine ]      |
|  - Raw Tour Prompts  --->  - Gemini 1.5 Flash   --->  - Hindi / English   ---> - 80/20 Value      |
|  - Video Assets            - Resilient JSON           - +91 90798 54982        - WhatsApp CTAs    |
|  - Local File Drop         - Markdown Clean           - Local Hashtags         - Brand Voice      |
+---------------------------------------------------------------------------------------------------+
                                                                                     |
                                                                                     v
+---------------------------------------------------------------------------------------------------+
|  [ Anti-Spam Scheduler ]   [ Token Introspection ]    [ Platform Publishers ]  [ Real-Time Alerts]|
|  - Jitter (60-90m)   --->  - Channel Tester     --->  - Meta / Graph API  ---> - Telegram Bot     |
|  - Crash Recovery          - No Synthetic Tokens      - YouTube v3 Resumable   - Live Dashboard   |
|  - IST Daily Tri-Digest    - Pre-flight Auth Checks   - LinkedIn / Pinterest   - /health/deep     |
+---------------------------------------------------------------------------------------------------+
```

### Core Integrity Philosophy
1. **100% Genuine Live Publishing**: All social platform publishers (Facebook, Instagram, LinkedIn, Pinterest, YouTube, Twitter/X, Reddit, Threads, Google Business, WordPress/Blog) execute authentic HTTP API operations against official vendor endpoints.
2. **Complete Simulation Purge**: The system strictly forbids `simulated: true`, fake post IDs, or synthetic success flags. When credentials expire or API permissions are insufficient, the system fails explicitly and transparently.
3. **Transparent Error Propagation**: Every upstream failure is captured with HTTP status codes and platform error payloads, logged with stack traces, and broadcasted to Telegram and the dashboard.
4. **Deterministic Storage Lifecycle**: Media files are retained until all target channels authentically succeed, protecting against premature data loss during partial publishing failures.

---

## 2. Multi-Agent Node.js Architecture (Swarm Alignment)

Rather than relying on monolithic, heavy agent frameworks designed in Python (e.g. OpenAI Swarm, CrewAI, AutoGen, LangChain), Lexa Trip achieves autonomous Swarm coordination natively in **Node.js CommonJS**.

### 2.1 Micro-Agent Taxonomy & Responsibilities

| Micro-Agent | Primary Service File | Responsibility & Behavioral Contract | Failure Domain Isolation |
|---|---|---|---|
| **AI Content & Ingestion Engine** | `services/aiEngine.js` | Multimodal LLM routing (Gemini 1.5 Flash, OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet). Normalizes unstructured text, extracts JSON structures via `safeParseAIJson`, and provides local regex heuristics fallback. | Never throws fatal crashes; falls back to deterministic rule-based template generation on LLM API outage. |
| **SEO & Localization Generator** | `services/seoGenerator.js` | Destination knowledge base (Jaisalmer, Mount Abu, Udaipur, Jaipur, etc.), bilingual copy (Hindi/English), verified contact links (`+91 90798 54982`, `bookings.lexatrip.com`), localized hashtag generation, and brand safety compliance. | Pure functional module; zero external network dependencies. |
| **QA & Community Engagement Engine** | `services/qaEngine.js` | Formulates 80/20 value-first Q&A responses, anti-spam protections, and direct click-to-chat WhatsApp links (`wa.me/919079854982`) for customer acquisition across travel forums (Reddit, Quora, Travel blogs). | Self-contained rule engine; enforces minimum answer length and URL safety checks. |
| **Anti-Spam Queue & State Scheduler** | `services/scheduler.js` | Finite state machine (`queued` -> `publishing` -> `published` / `partial_or_failed` / `failed`). Calculates randomized human-like jitter delays (60-90 minutes), executes startup crash/orphan sweep (`recoverOrphanedJobs`), and aggregates IST daily tri-digest reports. | Queue state is transactionally persisted to `database/data.json` before and after dispatch; network failures do not stall queue runner. |
| **Channel Tester & Token Introspection Agent** | `services/channelTester.js` | Live API verification agent. Validates token scopes, expiration, and page permissions. Strictly intercepts and rejects all synthetic `smart_` tokens or simulated mocks. | Executes pre-flight HTTP queries with strict 10s timeouts; prevents broken dispatches from polluting live queue. |
| **Human-in-the-Loop Telegram Bot & Notifier** | `services/telegramBot.js`, `services/telegramNotifier.js` | Interactive command interface (`/status`, `/publish_now`, `/health`, `/help`), rich media preview cards, transparent error reporting with authentic platform URLs, and broadcast channel alerts. | Runs asynchronously outside publisher execution loop; Telegram API rate limits or 500s do not block core scheduling. |

### 2.2 Swarm Coordination & Asynchronous Data Contracts

The agents communicate via strictly typed, asynchronous handoff contracts:

```
[Raw Tour Prompt / Destination]
               |
               v (Contract: { destinationId, title, rawNotes, mediaPath })
     [ AI Ingestion Engine ]
               |
               v (Contract: { title, caption, hashtags, storyHook, callToAction })
     [ SEO & Localization Generator ]
               |
               v (Contract: { enrichedCaption, localizedHashtags, directLinks })
     [ QA & Community Engine ]
               |
               v (Contract: Enriched Post Object in Queue with status: 'queued')
     [ Anti-Spam Queue Scheduler ]
               |
               +---> (Pre-flight Introspection via Channel Tester Agent)
               |
               v (Contract: Authentic API Requests to Platform Endpoints)
     [ Platform Publishers ]
               |
               v (Contract: { platform, success: boolean, postId, postUrl, error })
     [ Telegram Alerting & Dashboard Telemetry ]
```

---

## 3. 256MB Container Memory Cap & Lean Micro-Agent Design

### 3.1 Why Node.js CommonJS Beats Heavy Python Frameworks

Production cloud environments (such as Render Standard/Free containers or edge micro-VMs) impose strict memory constraints:
- Node.js runtime process limit: `--max-old-space-size=256` (256MB max V8 heap).
- Total container RSS ceiling: 512MB hard limit.

Deploying Python-based multi-agent frameworks (e.g. OpenAI Swarm, CrewAI, AutoGen) introduces massive memory penalties:
- Python base runtime: ~40MB - 60MB.
- Heavy Python ML/RPC dependencies (`torch`, `pydantic-v2`, `transformers`, `numpy`, `grpcio`): 300MB - 1GB+ RAM on boot.
- Result in 256MB/512MB container: **Immediate Out-Of-Memory (OOM) fatal SIGKILL**.

In contrast, Lexa Trip’s Node.js CommonJS architecture operates at:
- Base Process RSS: **~35MB - 50MB**.
- Active V8 Heap: **~12MB - 20MB**.
- Headroom: **Over 200MB of free RAM** reserved for high-throughput video encoding (`fluent-ffmpeg`), image composition (`sharp`), and streaming HTTP payloads.

### 3.2 Memory Preservation Strategies

1. **Zero-Memory-Bloat Adapters**: Heavy SDKs like `firebase-admin` and `@google-cloud/storage` (which pull dozens of gRPC, protobuf, and Google Auth dependencies consuming 40MB-80MB) are completely omitted. Native Node.js `crypto` (RSA-SHA256 JWT) and `axios` are used instead.
2. **Streaming Media I/O**: File uploads use `fs.createReadStream` piped directly into HTTP request streams, eliminating V8 buffer allocations for 50MB+ video reels.
3. **Event Loop Non-Blocking**: Background intervals (e.g. `memoryMonitor`) invoke `.unref()` so they do not block event loop termination during graceful shutdown or integration test runs.
4. **Active Memory Guard**: `server.js` polls `process.memoryUsage()`. If RSS reaches threshold levels, garbage collection is triggered proactively (`global.gc()`), and warning telemetry is emitted.

---

## 4. Google Developer Knowledge API Guidelines

Lexa Trip strictly adheres to official Google Developer Knowledge standards for Google Cloud, YouTube, and Google Business Profile APIs.

### 4.1 YouTube Data API v3: Two-Phase Resumable Video Uploads

For publishing vertical YouTube Shorts (`services/publishers/youtube.js`), the platform implements the official Google Resumable Upload protocol.

#### Two-Phase Protocol Architecture
```
[ Lexa Trip Node.js ]                                  [ Google Upload Servers ]
         |                                                         |
         |  1. POST /upload/youtube/v3/videos?uploadType=resumable |
         |     Headers: Content-Type: application/json             |
         |     Body: { snippet, status }                           |
         |-------------------------------------------------------->|
         |                                                         |
         |  2. HTTP 200/201 Created                                |
         |     Location: https://www.googleapis.com/upload/...     |
         |<--------------------------------------------------------|
         |                                                         |
         |  3. PUT (Binary chunk stream to Location URI)           |
         |     Headers: Content-Length: [bytes], Content-Type      |
         |     Body: fs.createReadStream(videoPath)                |
         |-------------------------------------------------------->|
         |                                                         |
         |  4. HTTP 200 OK                                         |
         |     Body: { id: "video_id_xyz", snippet: { ... } }      |
         |<--------------------------------------------------------|
```

#### YouTube Shorts Technical Specifications
- **Aspect Ratio**: Vertical 9:16 (1080x1920 pixels).
- **Duration**: $\le 60$ seconds.
- **Tagging**: Title and description must include `#Shorts` to trigger automatic YouTube Shorts shelf placement.
- **Category ID**: Category `19` (Travel & Events).
- **OAuth 2.0 Authorization**:
  - Scope: `https://www.googleapis.com/auth/youtube.upload`.
  - Simple API keys (`AIzaSy...`) are strictly read-only and rejected by Google for write/upload endpoints.
  - Token refresh: OAuth2 refresh tokens are exchanged at `https://oauth2.googleapis.com/token`.
- **Quota Management**:
  - Each `video.insert` call consumes **1600 units** out of Google's default 10,000 units/day quota.
  - The scheduler enforces rate limiting and checks quota health before dispatch.

### 4.2 Google Business Profile API v4: Local Posts

For publishing local business updates and offers (`services/publishers/googleBusiness.js`), the platform communicates with Google My Business v4 REST endpoints.

#### Resource Hierarchy & Endpoint
`POST https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts`

#### Schema Requirements
```json
{
  "languageCode": "en-US",
  "topicType": "STANDARD",
  "summary": "Experience the magic of Sam Sand Dunes with Lexa Trip Jaisalmer. Book your luxury desert camp today!",
  "callToAction": {
    "actionType": "BOOK",
    "url": "https://bookings.lexatrip.com/jaisalmer"
  },
  "media": [
    {
      "mediaFormat": "PHOTO",
      "sourceUrl": "https://firebasestorage.googleapis.com/v0/b/lexatrip.appspot.com/o/..."
    }
  ]
}
```

#### Google Crawler Accessibility Requirement
- Google Business Profile API **does not accept raw binary image uploads** in the post body.
- Instead, it requires `sourceUrl` pointing to an accessible HTTPS image.
- Google's image crawlers (`Googlebot-Image`) must be able to fetch the URL over public HTTPS without requiring authorization headers or cookies.
- Local URLs (`http://localhost:3800/...`) or restricted intranet links will cause Google to reject the post with HTTP 400 `INVALID_ARGUMENT: Unable to download media`.
- Lexa Trip solves this by resolving public URLs via **Firebase Storage CDN** or **TunnelService** before submission.

---

## 5. Storage & CDN Media Delivery Subsystem

### 5.1 Hybrid CDN Architecture

```
                       +-------------------------------+
                       |   Incoming Media File Path    |
                       +-------------------------------+
                                       |
                                       v
                   [ Is Firebase Storage Configured? ]
                                 /   \
                         YES    /     \    NO
                               v       v
      +----------------------------+   +----------------------------+
      |  services/firebaseStorage  |   |   services/tunnelService   |
      |  - RS256 JWT OAuth2 Auth   |   |  - Render PUBLIC_URL or    |
      |  - Direct Cloud CDN URL    |   |    localtunnel proxy       |
      |  - Global edge caching     |   |  - Express static mount    |
      +----------------------------+   +----------------------------+
                    |                                |
                    +----------------+---------------+
                                     |
                                     v
                       [ Verified Public Media URL ]
                                     |
               +---------------------+---------------------+
               |                     |                     |
               v                     v                     v
       [ Instagram Graph ]   [ Pinterest v5 Pin ]   [ Google Business ]
```

1. **Primary: Firebase Storage CDN Adapter (`services/firebaseStorage.js`)**:
   - High-availability CDN edge URLs (`https://firebasestorage.googleapis.com/v0/b/...`).
   - Memory-efficient streaming uploads via Node.js native streams.
   - Built-in token expiration detection and automatic renewal.
2. **Secondary: Local Tunnel Service (`services/tunnelService.js`)**:
   - Transparent fallback if Firebase credentials are absent or remote upload times out.
   - Normalizes Windows drive paths (`D:/...`), replaces backslashes with forward slashes, and maps to Express static directories (`/uploads`, `/generated`, `/public`, `/audio`).

### 5.2 Deterministic Garbage Collection (`services/storageManager.js`)

To keep local disk usage within cloud container limits:
- A recurring background cleanup job executes every 6 hours (with a 2-minute initial startup grace period).
- **Safety Invariant**: Media is unlinked **ONLY** when `isAuthenticallyPublished(item)` returns true across all destination target platforms.
- Files associated with active dispatches, failed queue items awaiting retry, or newly generated draft batches are protected from deletion.

---

## 6. Deep Health Telemetry & Verification (`GET /health/deep`)

The deep health telemetry subsystem provides programmatic and human-auditable status verification.

### Endpoint Contract
- **Path**: `GET /health/deep` (Optional query parameter: `?destinationId={id}`)
- **Success (200 OK)**: All core subsystems (Database, Memory, Telegram, Channels) report healthy status.
- **Degraded (503 Service Unavailable)**: Any subsystem reports a warning, unconfigured state, or channel authentication failure.

### Telemetry Payload Structure
```json
{
  "status": "healthy",
  "timestamp": "2026-11-20T16:30:00.000Z",
  "uptime": 3482.12,
  "checks": {
    "database": {
      "status": "healthy",
      "destinationsCount": 5,
      "queueLength": 12
    },
    "memory": {
      "status": "healthy",
      "rssMB": 42.18,
      "heapMB": 15.64,
      "limitMB": 256
    },
    "telegram": {
      "status": "healthy",
      "botConfigured": true
    },
    "channels": {
      "facebook": { "status": "connected", "details": "Lexa Trip Facebook Page" },
      "instagram": { "status": "connected", "details": "lexatrip.official" },
      "youtube": { "status": "connected", "details": "Lexa Trip Channel" },
      "pinterest": { "status": "connected", "details": "Lexa Trip Travel" },
      "linkedin": { "status": "connected", "details": "Lexa Trip Company" }
    }
  }
}
```

### Invariants Verified by Automated Tests
1. **Zero Mock Policy**: Telemetry payloads contain 0 occurrences of `simulated: true`, `"status": "simulated"`, or synthetic stub strings.
2. **256MB Cap Enforcement**: If process RSS reaches or exceeds 256MB, `checks.memory.status` changes to `'warning'` and the HTTP status code degrades to 503.
3. **Synthetic Credential Rejection**: Any channel configured with `smart_` tokens or synthetic mocks fails verification and degrades the system status to 503.
