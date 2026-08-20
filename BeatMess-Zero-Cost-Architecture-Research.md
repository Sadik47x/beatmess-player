# BeatMess — ₹0 Reliability Architecture (Deep Research Report)
### JioSaavn-Primary / Piped-Fallback Backend — Researched Fresh, Not From Old Tutorials

---

## Research methodology & honesty note (read this first)

I pulled from these live sources today, not from training-data memory:

- **TeamPiped/documentation** raw `public-instances/index.md` (the current official list — fetched directly)
- **TeamPiped/OpenAPI** `swagger.yaml` (the actual current API schema — fetched directly)
- **TeamPiped/piped-uptime** — the project's own live Upptime status dashboard (auto-updates every few minutes via GitHub Actions)
- A live test-fetch of `pipedapi.kavin.rocks/healthcheck` performed *during this research session*
- `sumitkolhe/jiosaavn-api` (the actual codebase behind `saavn.dev`) and a sibling project's README warning about public-instance rate-limiting
- `docs.invidious.io` current instance-admission criteria
- Five independent 2026-dated hosting-pricing comparison articles for Render/Railway/Fly.io/Vercel/Cloudflare Workers

**What I could NOT do:** most Piped instance endpoints refuse automated fetching (`robots.txt` disallow) from my tooling, and my fetch tool only allows URLs that have already surfaced via search — so I could not personally curl all 14 official instances' `/search` and `/streams/{id}` right now and hand you fresh per-instance latency numbers. Where I say "verified live" below, I mean it literally (I fetched it during this session). Where I say "per the project's own uptime tracker," that's a live third-party source, not my own probe. I'm flagging the difference explicitly rather than presenting both as equally certain — and this is exactly why **Section H (health-check strategy) is the part of this architecture that actually matters most**: no static list, including this one, should be trusted at runtime. Your own app has to check.

---

## A. Executive Recommendation

Build it as: **JioSaavn (self-hosted, not the shared public instance) → Piped provider pool (health-checked, ranked, circuit-broken) → Invidious pool (same treatment) → graceful, honestly-labeled failure.**

The single highest-leverage decision in this whole architecture is: **do not depend on the shared public `saavn.dev` instance, and do not depend on the shared public Piped instances, as your only path.** Both categories of unofficial API are volunteer-run, unfunded, and explicitly warn (in their own docs/READMEs) that the public demo instances are rate-limited and that self-hosting is the reliability answer. Since your own backend is going to be a thin serverless proxy anyway (Section K), self-hosting your own JioSaavn wrapper costs nothing extra and removes your single biggest point of failure. This is the one place where "fresh research" changes the recommendation from what most old tutorials tell people to do (hit the public `saavn.dev` URL directly from the frontend).

---

## B. Current Verified Piped Instance Table

This is the **current official list** (14 entries, fetched directly from `TeamPiped/documentation` today — not the old commonly-copy-pasted list, which is shorter and includes several instances that are now dead, like `tokhmi.xyz` and `moomoo.me`, both confirmed dead in the live uptime tracker below).

| Instance | API URL | Location(s) | CDN | What I actually know about current health |
|---|---|---|---|---|
| kavin.rocks (Official) | `pipedapi.kavin.rocks` | 🇺🇸🇮🇳🇳🇱🇨🇦🇬🇧🇫🇷 | Yes | **Mixed live signal.** The project's own Upptime dashboard shows it "Up," 285ms, 100% recent uptime — but I personally test-fetched `pipedapi.kavin.rocks/healthcheck` minutes ago during this research and got a **526 error** (origin/SSL handshake failure via Cloudflare). Also has a multi-year history of repeated outage issues filed against it going back to 2022. Treat as "usually available, but demonstrably not always" — exactly the profile that needs a real health-checker, not blind trust. |
| kavin.rocks libre (Official) | `pipedapi-libre.kavin.rocks` | 🇳🇱 | No | My fetch attempt was blocked by robots.txt; historical uptime-issue record shows repeated 502s in the past. Unverified today. |
| leptons.xyz | `pipedapi.leptons.xyz` | 🇦🇹 | Yes (per official docs) | **Contradicted by live data.** Official docs list it as CDN-enabled and presumably healthy, but the project's own live Upptime tracker shows it currently **Down**, with only 33% all-time and 0% recent uptime. This is a concrete example of the official static list being stale — exactly what you asked me not to blindly trust. |
| nosebs.ru | `pipedapi.nosebs.ru` | 🇫🇮 | Yes | Not independently checkable today (not present in the uptime tracker's current tracked set, no robots-allowed fetch). Unverified. |
| privacy.com.de | `piped-api.privacy.com.de` | 🇩🇪 | No | Unverified today (fetch blocked). |
| adminforge.de | `pipedapi.adminforge.de` | 🇩🇪 | No | Unverified today (fetch blocked). |
| piped.yt | `api.piped.yt` | 🇩🇪 | No | Unverified today — robots.txt blocked my fetch attempt. |
| drgns.space | `pipedapi.drgns.space` | 🇺🇸 | No | Unverified today. |
| owo.si | `pipedapi.owo.si` | 🇩🇪 | No | Unverified today. |
| ducks.party | `pipedapi.ducks.party` | 🇳🇱 | No | Unverified today. |
| codespace.cz | `piped-api.codespace.cz` | 🇨🇿 | No | Unverified today. |
| reallyaweso.me | `pipedapi.reallyaweso.me` | 🇩🇪 | No | Unverified today. |
| private.coffee | `api.piped.private.coffee` | 🇦🇹 | No | Unverified today. |
| darkness.services | `pipedapi.darkness.services` | 🇺🇸 | No | Unverified today. |
| orangenet.cc | `pipedapi.orangenet.cc` | 🇸🇮 | No | Unverified today. |

**Important structural finding, not just individual-instance status:** the project's own community uptime dashboard (`TeamPiped/piped-uptime`) is tracking a *different, partially stale* set of instances than the current official docs list — it still includes several long-dead ones (`tokhmi.xyz`, `moomoo.me`, `syncpundit.io`, `mha.fi`, `garudalinux.org`, `rivo.lol`, `dc09.ru`, `colinslegacy.com`, `cfe.re`) that aren't even in the current official 14, alongside a couple that also aren't in the current official list (`lunar.icu`, `vyper.me`, `looleh.xyz`, `ggtyler.dev`). **This means there is currently no single authoritative, fully-current, fully-live-tested source for "which Piped instances work right now" — not the official docs, not the uptime dashboard, not this report.** The overall project status banner at the time of this research read **"🟧 Partial outage."** This is the strongest possible evidence for why your own app needs to do its own health-checking rather than hardcode a priority list (Section H is not optional polish — it's the actual reliability mechanism).

**Practical conclusion for redundancy:** don't assume 14 URLs = 14x redundancy. A meaningful chunk of that list is, on the evidence above, currently dead or unverifiable, several are unofficial community mirrors with no accountability if they vanish, and Piped instances as a category share the same fundamental fragility (they all depend on IP-rotation infrastructure to avoid YouTube's blocking, and YouTube tightening its extraction defenses tends to affect many instances simultaneously, not independently) — so the real independent redundancy is smaller than the list size suggests, but still meaningfully better than a single URL.

---

## C. Best Provider Order

Given the evidence above, a defensible starting priority order (to be overridden by your own live health-scores within hours of running, per Section H — this is just a sane cold-start default):

1. **Your own self-hosted JioSaavn wrapper** (not the shared `saavn.dev`) — Section E
2. `pipedapi.kavin.rocks` — official instance, India is explicitly one of its listed regions (relevant for your latency), largest user base, but demonstrated flaky today
3. `pipedapi-libre.kavin.rocks` — same maintainer, different infra, reasonable first fallback if the primary kavin.rocks node is the one having trouble
4. 2–3 more from the CDN-flagged tier (`leptons.xyz`, `nosebs.ru`) — even though `leptons.xyz` showed down today, CDN-backed instances are structurally the better bet *when* they're up
5. Remaining non-CDN instances, ordered by your own measured health score, not by list position
6. Invidious pool (Section F) — last resort before giving up

---

## D. Complete Failover Architecture

```
Frontend (React)
  ↓ GET /api/search?q=...
Your Backend (Vercel Serverless Function / Cloudflare Worker)
  ↓
┌─────────────────────────────────────────┐
│ 1. Self-hosted JioSaavn wrapper           │
│    (your own Vercel/CF Worker deployment  │
│     of sumitkolhe/jiosaavn-api)           │
└─────────────────────────────────────────┘
  ↓ empty / error / timeout
┌─────────────────────────────────────────┐
│ 2. Piped Provider Manager                 │
│    - reads live health-score cache        │
│    - tries healthiest instance first       │
│    - timeout: 4s connect, 6s total         │
│    - on fail → mark unhealthy, blacklist   │
│      for cooldown period, try next         │
│    - on success → cache as "last known     │
│      good," return normalized result       │
└─────────────────────────────────────────┘
  ↓ all Piped instances exhausted
┌─────────────────────────────────────────┐
│ 3. Invidious Provider Manager             │
│    (same health-check/circuit-breaker      │
│     logic, separate instance pool)         │
└─────────────────────────────────────────┘
  ↓ all providers exhausted
┌─────────────────────────────────────────┐
│ 4. Graceful, honestly-labeled failure      │
│    (see Section J — never silently         │
│     reported as "no results")              │
└─────────────────────────────────────────┘
```

**Never call every instance simultaneously.** Fan-out-to-all on every user search wastes your free-tier CPU budget (this matters concretely on Cloudflare Workers Free, which caps at 10ms of actual JS-execution CPU time per request — see Section G) and is also an inconsiderate way to treat other people's volunteer-run infrastructure. Sequential-with-fast-timeout, informed by a cached health score, is both cheaper and more polite.

---

## E. JioSaavn Strategy

`saavn.dev` traces back to `sumitkolhe/jiosaavn-api`, an MIT-licensed, actively-documented TypeScript wrapper. A closely related project (`HavyasU/savan-api`, whose public demo is `saavn.me`) states outright that its public demo instance is rate-limited specifically to control bandwidth costs, and explicitly recommends personal users deploy their own instance to Vercel. That's the same underlying pattern as `saavn.dev`, and it's the single most actionable finding of this whole research pass: **the "unofficial JioSaavn API" ecosystem's own maintainers are telling you not to depend on the shared public instance for anything beyond casual testing.**

- **Search endpoint:** `/api/search/songs?query=<q>&page=0&limit=20` (and `/api/search` for a combined search across songs/albums/artists/playlists)
- **Song metadata:** `/api/songs/<id>` or `/api/songs?link=<jiosaavnUrl>`
- **Lyrics:** `/api/songs/<id>/lyrics` — availability is inconsistent per track; plan for tracks with no lyrics data at all, not just unsynced lyrics
- **Audio URL availability:** returned directly in the song object as a `downloadUrl`/`download_url` array across multiple bitrates; these are direct client-playable URLs
- **URL expiry:** JioSaavn's CDN URLs are time-limited signed URLs — don't cache them long-term; re-fetch the song object if playback is attempted more than roughly an hour after the search that produced it (exact TTL isn't published; treat it as short-lived by design)
- **Backend proxying:** not strictly required for playback (the URLs are meant to be hit directly by a client), but routing search *requests* through your own backend still matters — it's what lets you self-host instead of hammering the shared public instance, and it's what makes the fallback chain to Piped possible without exposing your fallback logic/instance list to the client
- **Rate limits:** not publicly documented as fixed numbers; the practical constraint is the shared public instance's traffic, which is exactly what self-hosting avoids

**Recommendation:** deploy your own instance of `sumitkolhe/jiosaavn-api` to Vercel (one-click, matches the project's own documented deploy path) and put its URL behind your own `VITE_SAAVN_API_BASE`-style env var, with `https://saavn.dev` kept only as an emergency last-resort fallback *before* falling through to Piped — not as your primary dependency.

---

## F. YouTube Fallback Strategy

Comparing the realistic ₹0 options, researched fresh:

| Option | ₹0 possible | API key | Maintenance | Reliability (2026 evidence) | Verdict |
|---|---|---|---|---|---|
| Piped public instances | Yes | No | None (you don't run it) | Volatile — official list itself contains dead entries as shown in Section B; overall project status was "partial outage" during this research | **Use as primary fallback**, but only behind a real health-checker |
| Self-hosted Piped | Yes (compute-wise) | No | High — needs its own IP-rotation/proxy infra to avoid being blocked by YouTube, which is nontrivial to run reliably for free | Realistically hard to keep healthy on a free-tier box long-term | Not recommended for a solo/college project — the ops burden defeats the purpose |
| Invidious public instances | Yes | No | None | Official instance-admission criteria require ≥90% uptime and manual maintainer review before listing — a real, if imperfect, quality gate that Piped's list doesn't have | **Use as secondary fallback**, structurally somewhat more vetted per-instance, but a smaller usable pool |
| Self-hosted Invidious | Yes (compute-wise) | No | High, same IP-rotation problem as self-hosted Piped, plus YouTube has previously sent Invidious a cease-and-desist (project chose to continue operating; relevant to your own risk tolerance, see Section O) | Same as self-hosted Piped | Not recommended for this project |
| `yt-dlp`-based backend | Yes (compute-wise) | No | Medium-high — yt-dlp itself is well-maintained, but running it as a persistent extraction backend on a free serverless platform is awkward (it's a Python process, not a lightweight HTTP call, and free serverless CPU/time budgets fight it) | Extraction logic is actively maintained upstream, but YouTube's countermeasures mean it needs frequent updates | Viable as a *personal* fallback if self-hosted on your own machine/VPS, not realistic as a ₹0 cloud-hosted fallback for this project |

**Recommendation:** Piped pool first, Invidious pool second, both public-instance-based (not self-hosted), both behind your own health-checker. Do not attempt self-hosted extraction infrastructure for a ₹0 college/personal project — the maintenance burden is disproportionate to the benefit, and it's the one place in this whole plan where "free" quietly becomes "requires ongoing engineering effort to not break."

---

## G. Free Hosting Recommendation

The free-hosting landscape shifted meaningfully by 2026, confirmed across five independent, recently-dated sources:

- **Railway and Fly.io no longer have a genuine ongoing free tier** for new accounts — both moved to short trial credits (Railway: one-time $5 credit; Fly.io: ~2-hour or 7-day trial), then require a card and paid usage.
- **Render still has a real permanent free tier** for web services, but free-tier services spin down after 15 minutes of inactivity and take 30–60 seconds to wake on the next request — a bad experience for an interactive search-as-you-type feature.
- **Vercel's Hobby plan is free forever for personal, non-commercial projects** — which is exactly what this app is. Current limits: 100GB bandwidth/month, ~1M function invocations, 10-second max execution per serverless function call, no persistent-server cold-start problem in the Render sense (functions are invoked per-request rather than sleeping/waking a whole server).
- **Cloudflare Workers' free plan** gives 100,000 requests/day with sub-1ms cold starts (V8 isolates, not containers), but only **10ms of actual CPU execution time per request** — importantly, this excludes time spent waiting on outbound `fetch()` calls (network I/O wait isn't billed as CPU), which matters a lot for this use case since your fallback-chain orchestrator spends most of its time waiting on Piped/Invidious responses, not computing.

**Recommendation:** host the backend as **Vercel Serverless Functions (Next.js API routes)** — free tier fits a personal/college project's terms of service exactly, avoids Render's cold-start problem entirely, and the 10-second function timeout is generous enough for a sequential health-aware fallback chain with short per-instance timeouts (Section D's 4s/6s budget comfortably fits inside it). Self-host your JioSaavn wrapper (Section E) as a **second, separate Vercel deployment** — free, independent, and matches the upstream project's own documented deploy path. Cloudflare Workers is a solid alternative if you prefer the health-check/orchestration logic to run at the edge, but the 10ms CPU ceiling on Free means you should keep the actual JS work (JSON parsing/normalization) as lean as possible if you go that route.

**Do not use Render's free web-service tier** for the interactive search backend specifically because of the cold-start latency — it's fine for a background cron-style health-checker if you want one running independently of user requests, though.

---

## H. Health-Check Strategy

Design as a two-layer system:

**Layer 1 — Passive, request-driven scoring (no extra cost, runs on real traffic):**
Every time a real user search hits a provider, record success/failure, latency, and whether the response validated (correct JSON shape, non-empty `items`/`audioStreams`). Update a rolling health score per instance:

```
healthScore = (successRate_last20 * 0.5)
            + (validResponseRate_last20 * 0.3)
            + (normalizedLatencyScore * 0.2)
```

Store this in a lightweight KV store (Vercel KV / Cloudflare KV both have usable free tiers) keyed by instance URL, with a short TTL so stale data doesn't permanently blacklist a recovered instance.

**Layer 2 — Active background probing (optional, keeps the score fresh even during low traffic):**
A scheduled function (Vercel Cron on Hobby supports daily-granularity cron jobs for free; for finer granularity you'd need a paid plan or an external free cron pinger like a GitHub Actions scheduled workflow — which is itself ₹0 and a reasonable choice here) hits each instance's `/healthcheck` (Piped) or `/api/v1/stats` (Invidious) every few minutes, updating the same score store. This is exactly the pattern `TeamPiped/piped-uptime` itself uses (Upptime, running on GitHub Actions) — piggybacking the same free mechanism for your own instance pool is a reasonable, zero-cost choice.

**Circuit breaker logic:**
- 3 consecutive failures → mark instance "unhealthy," blacklist for a cooldown window (start at 5 minutes, exponential backoff up to ~1 hour for repeatedly-failing instances)
- Cooldown expiry → move to "recovering," allow one real request through as a probe
- Probe succeeds → back to "healthy," rejoin normal rotation
- Probe fails → cooldown doubles, repeat

---

## I. Caching Strategy

| Data | Cache? | TTL | Why |
|---|---|---|---|
| Search results | Yes | 10–30 min | Reduces repeat load on providers for popular queries; short enough that new uploads/corrections surface reasonably fast |
| Song metadata (title/artist/art) | Yes | Several hours | Rarely changes once published |
| Lyrics | Yes | Long (days) | Effectively static per track |
| Provider health status | Yes | 1–5 min, self-refreshing | This *is* the health-check cache from Section H |
| Last-known-good provider | Yes | Until next failure | Avoids re-probing a working instance on every single request |
| Failed-provider cooldown | Yes | Per the circuit-breaker backoff schedule | Core to not hammering a dead instance |
| **Audio stream URLs** | **No — or extremely short TTL only** | N/A | Both JioSaavn's signed CDN URLs and Piped's `audioStreams[].url` are time-limited; caching them past their real expiry silently breaks playback. Re-resolve at play-time, not at search-time. |

---

## J. Error-State Design

Implement exactly the four states you specified, mapped to concrete backend response shapes:

```json
// A. Zero results, search succeeded
{ "status": "empty", "message": "No results found." }

// B. This specific provider failed (used internally, not usually shown raw to user)
{ "status": "provider_error", "provider": "piped", "instance": "pipedapi.kavin.rocks" }

// C. All Piped instances exhausted, JioSaavn also had nothing
{ "status": "fallback_unavailable", "message": "YouTube search is temporarily unavailable. Try again shortly." }

// D. Success
{ "status": "ok", "provider": "jiosaavn" | "piped" | "invidious", "results": [...] }
```

The frontend's job is simple: **never collapse `provider_error`/`fallback_unavailable` into the same empty-state UI as a genuine zero-result search.** This is a one-line rule but it's the exact bug you flagged as currently misleading users — worth a dedicated `SearchStatus` type in your TypeScript layer so it's structurally impossible to accidentally merge the two.

---

## K. Backend API Design

```
Frontend
  ↓ GET /api/search?q=...
Backend (single entry point, frontend never talks to any provider directly)
  ↓ musicGateway.search(query)
     1. try selfHostedSaavn.search(query)
     2. if empty/error → pipedManager.search(query)  [health-aware, circuit-broken]
     3. if empty/error → invidiousManager.search(query)  [same]
     4. normalize whichever succeeded into:

{
  id: string,          // provider-namespaced, e.g. "saavn:abc123" or "piped:dQw4w9WgXcQ"
  title: string,
  artist: string,
  thumbnail: string,
  duration: number,    // seconds
  provider: "jiosaavn" | "piped" | "invidious",
  playable: boolean,
  streamUrl: string | null   // resolved lazily at play-time for Piped/Invidious, not stored long-term
}
```

Fields above are drawn from what's actually available per the verified schemas: JioSaavn's song object, and Piped's confirmed `StreamItem`/`VideoInfo.audioStreams[]` shape (Section below has the exact verified fields — no invented field names).

**Verified Piped `/search?q=<q>&filter=<f>` response shape** (from the official `TeamPiped/OpenAPI` spec, fetched directly):
- Valid `filter` values are an enum: `all`, `videos`, `channels`, `playlists`, `music_songs`, `music_videos`, `music_albums`, `music_playlists`, `music_artists` — **for a music app, `music_songs` is the correct filter, not the generic `videos` your draft used.**
- Response is a `SearchPage`: `{ corrected: boolean, items: SearchItem[], nextpage: string|null, suggestion: string|null }`
- Each `SearchItem` is a discriminated union on a `type` field (`"stream"` / `"channel"` / `"playlist"`); for songs you want `type: "stream"` items, which have: `duration`, `thumbnail`, `title`, `uploaded`, `uploaderName`, `uploaderUrl`, `uploaderVerified`, `url` (a **relative** path like `/watch?v=VIDEOID` — extract the ID from this), `views`, `isShort`, `shortDescription`, `contentLength`

**Verified `/streams/{videoId}` response shape** (`VideoInfo`):
- `audioStreams: Stream[]` — each has `url`, `format` (enum including `M4A`, `WEBM`, `MP3`, `OPUS`, `WEBMA_OPUS`, etc.), `quality`, `mimeType`, `codec`, `bitrate` — pick the highest-bitrate audio-only entry
- Also: `title`, `uploader`, `duration`, `thumbnailUrl`, `hls`, `dash`, `livestream` (boolean — **filter these out**, you don't want a livestream in a music search), `relatedStreams` (useful for an autoplay/"more like this" queue if you want it later)

---

## L. Exact Implementation Workflow

1. Deploy your own `sumitkolhe/jiosaavn-api` instance to Vercel — this becomes your primary provider, replacing direct calls to shared `saavn.dev`.
2. Build `pipedManager.ts`: the official 14-instance list (Section B) as your seed pool, `filter=music_songs` on search, health-score-ordered selection, 4s/6s timeout budget, circuit breaker per Section H.
3. Build `invidiousManager.ts` the same way, seeded from the current Invidious instance API.
4. Build `musicGateway.ts` chaining all three per Section D, returning the normalized shape from Section K.
5. Wire the four error states from Section J as a discriminated TypeScript union, not four separate ad-hoc strings.
6. Add the caching layer from Section I (Vercel KV or an equivalent free KV store).
7. Add the background health-prober (Vercel Cron or a GitHub Actions scheduled workflow) from Section H, Layer 2.
8. Load-test your own fallback chain by deliberately searching nonsense queries and by temporarily hardcoding a "always fail" primary provider, to confirm the UI shows the correct one of the four states from Section J rather than a generic empty state.

---

## M. What NOT To Do

- Don't call every Piped instance simultaneously "for safety" — it burns your free-tier CPU/request budget faster and is inconsiderate to volunteer-run infra.
- Don't hardcode a static "best instance" and never re-check it — Section B directly demonstrates the official list contains currently-dead entries.
- Don't cache resolved audio stream URLs beyond their real (short) lifetime.
- Don't attempt self-hosted YouTube extraction (Piped/Invidious/yt-dlp) for this project — the IP-rotation/anti-blocking maintenance burden is disproportionate to a personal project's needs.
- Don't collapse "provider failed" and "zero results" into the same UI state — this was your own flagged bug; the fix is structural (a typed status enum), not cosmetic.
- Don't claim or design around 100% uptime anywhere in the UI copy or architecture docs — the honest ceiling here, given everything above, is "high practical availability with graceful degradation," not guaranteed availability.
- Don't put Render's free web-service tier under the interactive search path — the 30–60s cold-start wake will look like your app is broken.

---

## N. Estimated Monthly Cost

| Usage tier | JioSaavn (self-hosted, Vercel) | Backend orchestrator (Vercel) | Piped/Invidious | Total |
|---|---|---|---|---|
| Personal use (you only, a few dozen searches/day) | ₹0 — nowhere near Vercel Hobby's 1M invocation / 100GB limits | ₹0 | ₹0 (public instances, light load) | **₹0** |
| Small demo (college project demo, a handful of testers, few hundred requests/day) | ₹0 — still comfortably inside Hobby limits | ₹0 | ₹0, but expect occasional visible fallback-chain latency during instance flakiness | **₹0** |
| Moderate "public" traffic (hundreds of users, thousands of requests/day, sustained) | Risk of breaching Vercel Hobby's non-commercial/personal-use terms of service, and function-invocation/bandwidth limits become a real constraint | Same risk | Piped/Invidious public instances will likely rate-limit or block you — you become a "heavy" consumer of volunteer infrastructure, which is also the point where it stops being fair-use of a free public resource | **No longer realistically ₹0** — this is the honest line where the architecture's underlying assumption (personal/demo scale) stops holding, both technically and in terms of fair use of free community infrastructure |

---

## O. Final Verdict: "Best ₹0 Architecture"

**JioSaavn self-hosted (Vercel) → Piped provider pool (health-checked, circuit-broken, official list as seed) → Invidious provider pool (same treatment) → honest graceful failure**, all orchestrated from a single Vercel Serverless Function backend that the frontend is the only thing talking to.

This matches your originally proposed shape almost exactly, with three research-backed corrections: (1) self-host the JioSaavn layer instead of depending on the shared public instance, since the ecosystem's own maintainers explicitly recommend this; (2) skip the "optional self-hosted [Piped/Invidious] fallback" tier — the maintenance burden doesn't pay for itself at personal-project scale; (3) host on Vercel rather than Render specifically to avoid cold-start latency on the interactive search path, given 2026's shrunk free-tier landscape.

It will not be 100% reliable — nothing built on volunteer-run unofficial infrastructure honestly can be, and the evidence in Section B (a live "partial outage" status, a stale official list, a contradicted "healthy" instance) is direct proof of that, gathered today, not assumed. What it will be is **gracefully degrading**: JioSaavn covers the large majority of mainstream searches on its own, the Piped/Invidious layer catches the covers/remixes/mashups JioSaavn doesn't have, and when everything is simultaneously down, your users see an honest "temporarily unavailable" message instead of a misleading "no results" — which, for a free personal/college project, is a genuinely good and honestly-earned reliability bar.
