# Phase B Buy-In: Chat store layer (#1775 store slice)

Companion: [`project-selective-upstream-sync-phase-a-buy-in.md`](./project-selective-upstream-sync-phase-a-buy-in.md) (Phase A skipped except #1819 cherry-picks).

**Status:** Review only — **no wholesale port recommended.**

---

## What “Phase B” means in our manifest

From [`project-selective-upstream-sync-p1-file-manifest.md`](./project-selective-upstream-sync-p1-file-manifest.md):

| Slice | PRs | Files |
|-------|-----|--------|
| **Phase B** | Mostly **#1775** (+ #1819 context-store if not cherry-picked yet) | `session-store.ts`, `data-store.ts`, small `chat.ts` edits |
| **Phase C** | Same **#1775** | `libs/chat-sync/*`, `sessions-drawer.vue`, server WS, `ChatArea.vue` |

**Important:** Phase B and Phase C are **one product** upstream — **signed-in cloud chat sync** (`feat(stage-ui): chat sync`, #1775). You cannot adopt upstream’s Phase B `session-store` without the Phase C `chat-sync` stack; the store imports and calls `createChatWsClient`, `reconcileLocalAndRemote`, `cloudChatId`, `cloudMaxSeq`, etc.

With **#1826 skipped** and **#1819** handled separately, Phase B ≈ **“how upstream wires session storage to cloud sync.”**

---

## What upstream #1775 is trying to do

**Goal:** After login, chat sessions and messages **sync across devices/tabs** via:

- REST: list/create/delete chats, reconcile local IndexedDB vs server
- WebSocket: `sendMessages`, `newMessages`, `pullMessages` (seq cursor per session)
- UI: **Conversations drawer** (list / new / delete sessions)

**Explicit from PR body:** Anonymous / offline behavior unchanged — no WS, no REST; IndexedDB only.

---

## What your fork already has (overlap + divergence)

### You already split chat stores (Phase B was never “greenfield”)

You have: `session-store`, `data-store`, `stream-store`, `context-store`, hooks, context-providers, `session-message-merge`, etc. Upstream did **not** invent store splitting for you.

### You already have optional **cloud** sync — different architecture

| | Your fork | Upstream #1775 |
|--|-----------|----------------|
| When | `remoteSyncEnabled` + `isAuthenticated` | Signed-in cloud user (`userId !== 'local'`) |
| Transport | **Bulk REST** `POST .../chats/sync` per session (`scheduleSync` / `syncSessionToRemote`) | **WebSocket RPC** + incremental seq merge |
| Session meta | No `cloudChatId` / `cloudMaxSeq` | Maps local session ↔ cloud chat + seq cursor |
| Multi-tab (same machine) | **`BroadcastChannel`** on stream events + ingest handshake in `chat.ts` | WS `newMessages` + ID dedupe |
| Multi-device | Bulk sync on demand (if enabled) | Real-time push + pull on reconnect |
| Conversations UI | **No** `sessions-drawer` | 360-line drawer component |

So upstream is **not** “better session store” — it is **real-time multi-device cloud sync** plus drawer UX. Your fork already chose **simpler bulk upload** when cloud is enabled.

### You said: no online sign-in on desktop

If desktop stays **local-first** and you do not productize moeru’s hosted account flow:

- **~95% of #1775 (Phase B + C together) is out of scope.**
- Your existing local path (IDB + `BroadcastChannel` for tamagotchi windows) already covers **same-machine** multi-surface needs without their WS stack.

---

## Read-only diff: high-signal hunks

### 1. `session-store` — tightly coupled to cloud (skip wholesale)

Upstream `session-store.ts` (~1440 lines) adds imports from `libs/chat-sync` and:

- `reconcileCloudSessions()` on WS open / login
- `pushMessageToCloud` / `pullCloudMessages` per `cloudChatId`
- Outbox + tombstones for offline DELETE retry
- `cloudSyncReady`, `outboxPendingCount` exports

**Verdict:** Adopting upstream’s file = adopting Phase C + server stack. **Not worth squeeze** for local-first fork.

### 2. `deleteSession` ordering — **possible micro cherry-pick**

**Upstream fix (worth reading):** Mutate in-memory + index **first**, then `enqueuePersist` delete, then fire-and-forget cloud DELETE. Avoids a race where `persistSession` during network await **resurrects** deleted rows.

**Your fork today (`deleteSession`):**

```text
await enqueuePersist(() => delete from IDB)   // await first
then delete in-memory maps
```

That is the **opposite order** of upstream’s documented bugfix — you may still have the “deleted session reappears” race if anything persists during the await.

**Verdict:** **Cherry-pick the pattern** (sync memory → persist → optional remote) **without** cloud tombstones/WS. Small, local-only patch.

### 3. `loadSession` resurrection guard — **possible micro cherry-pick**

Upstream added after `await chatSessionsRepo.getSession`:

```text
if (!sessionMetas.value[sessionId]) return   // deleted while we were in IDB
```

Your `loadSession` lacks this — if user deletes from a future drawer while load is in flight, you can **resurrect** the session in memory/IDB.

**Verdict:** Worth porting **3 lines** if you add/have session list UI — independent of cloud.

### 4. `data-store.ts` (#1775: +2 / -9)

Tiny delegation tweak as session-store owns more cloud hooks upstream. **No standalone value** without full #1775.

### 5. `chat.ts` (#1775: +26 / -5)

Hooks orchestrator to `pushMessageToCloud` / cloud sync readiness. **Skip** with #1826 skipped and no cloud WS.

### 6. #1819 files in Phase B manifest

`context-store` / `context-bridge` — you are **already cherry-picking** via other agent. Not Phase B review scope here.

### 7. #1826-only Phase B files (`context-prompt.ts`, `datetime-prefix.ts` in `stores/chat/`)

Part of core-agent extraction. **Skip** with Phase A decision.

---

## Juice vs squeeze

| Approach | Effort | Reward for your fork |
|----------|--------|----------------------|
| **Skip all of Phase B + C** | None | Correct default if no cloud sign-in product |
| **Full #1775** | Very high (WS client, mapper, server-runtime, drawer, session rewrite) | Multi-device cloud chat — **only if you want moeru’s online product** |
| **Micro patches only** | Low (delete order + loadSession guard) | Fixes real races; no architectural churn |
| **Port `sessions-drawer` only** | Medium | Local conversation list UX — **build against your IDB**, not upstream drawer + cloud |

---

## Recommendation

1. **Do not treat Phase B as a port target** — it is the storage half of **#1775 cloud sync**, which you are not pursuing on desktop.
2. **Do not merge upstream `session-store.ts`** — you would replace a working bulk-sync + local broadcast design with a cloud-coupled 1.4k-line store.
3. **Consider micro cherry-picks** (no `libs/chat-sync`):
   - `deleteSession`: in-memory/index first, then persist (mirror upstream comment block)
   - `loadSession`: post-await “still exists?” guard
4. **Phase C** (same PR): same verdict — skip unless you want hosted multi-device chat; see table above.
5. Your **local multi-window** story stays: `BroadcastChannel` + `context-bridge` + secondary-window `ingest` — already fork-specific and **not** what #1775 replaces.

---

## Decision log

| Date | Decision | Notes |
|------|----------|-------|
| 2026-05-27 | Phase B wholesale: **skip** | Same PR as Phase C; cloud WS sync |
| 2026-05-27 | Optional micro patches | deleteSession order, loadSession guard |
| | Phase A #1826 | Skipped |
| | Phase A #1819 | Cherry-pick in progress (other agent) |
