# rn-documents

A React Native client. It lists the documents the server
serves, lets you create your own, and tells you in real time when someone else creates one.

Built with Expo SDK 57 (React Native 0.86, React 19, TypeScript 6) and runs on **Expo Go**, so
there is nothing to compile: install the dependencies, point it at the server and open it.

## What it does

- **Lists the documents** exposed by `GET /documents`, newest first, with a loading state, an
  empty state and an error state that says what went wrong.
- **Creates documents locally**, from a sheet with name, version and attachments picked
  from the device. New documents show up in the same list as the server ones.
- **Notifies about documents other users create**, over `ws://…/notifications`. A bell in the
  header carries the number of documents created since you last looked; tapping it clears the
  count. It survives the server going away and coming back without reloading the app.

## Running it

The app needs the challenge server running. From the server's directory:

```bash
go run server.go            # listens on 127.0.0.1:8080
```

Then, in this repository:

```bash
npm install
cp .env.example .env        # only if you need a base URL other than http://localhost:8080
npx expo start
```

Scan the QR with Expo Go, or press `a` / `i` to open an already running emulator.

### Reaching the server from a device

`localhost` inside the emulator or the phone is not your machine. The simplest fix that works
the same on an emulator, on a USB device and on the web is to forward the port:

```bash
adb reverse tcp:8080 tcp:8080
```

Otherwise, set `EXPO_PUBLIC_API_BASE_URL` in `.env` to your machine's LAN address. Note that
Expo inlines `EXPO_PUBLIC_*` variables into the bundle: after editing `.env` you have to
restart the bundler, Fast Refresh will not pick it up.

## Checks

```bash
npm test          # 94 tests, 20 suites (Jest + jest-expo + React Native Testing Library)
npm run typecheck # tsc --noEmit
npm run lint      # expo lint
```

Tests cover the domain, the use cases, every adapter and the screens. Each one was validated by
breaking the implementation on purpose and checking that it turned red — a test that passes
against a broken implementation is worse than no test, because it buys false confidence.

## Architecture

The code is organised **by feature, and inside each feature by layer**:

```
src/
├── composition.ts              # composition root: the only place that knows the real world
├── documents/
│   ├── domain/                 # Document, DocumentRepository, DocumentStore
│   ├── application/            # listDocuments, createDocument
│   ├── infrastructure/         # HTTP, in-memory and composite adapters, parsing
│   ├── ui/                     # screen, sheet, context, hooks
│   └── testing/                # builders and test doubles
└── notifications/              # same shape: domain, application-less, infrastructure, ui
```

Notifications live in their own feature rather than inside `documents` because they touch
neither the repository, nor the store, nor the list: they share the noun, not the state.

Use cases are **plain functions that take their dependencies as arguments**
(`listDocuments(repository)`), not classes with an `execute()`. Same substitutability, less
ceremony. The dependencies are built once at module level in `App.tsx` and handed down through a
context; building them inside the component would change their identity on every render and put
the fetch hook into a loop.

### The ports, and why they pay for themselves

`DocumentRepository` has **three real adapters**, which is what makes the port worth having:

- `httpDocumentRepository` — talks to the server, with a 10s timeout and a parser that keeps the
  documents it can read and discards the ones it cannot instead of failing the whole response.
- `inMemoryDocumentStore` — the documents you create.
- `compositeDocumentRepository` — reads from both and merges. A source that fails does not sink
  the others: if the server is down you still see your own documents, and only a total failure
  is reported as an error.

Writing lives in a separate `DocumentStore` port rather than in `DocumentRepository` because the
server exposes no way to create anything. A single writable port would force the HTTP adapter to
carry an `add` it could only ever fail at.

## What the server actually does, and what that forces

Four things that are not in the server's README but shape every decision here:

1. **There is no creation on the server.** `/documents` ignores the method: `GET`, `POST` and
   anything else return the same thing. Creating a document is therefore necessarily local.
2. **Every request returns entirely different documents** — between 2 and 21 fresh random ones,
   with fresh UUIDs. It is not a collection, it is a tap of fake data. There is no identity
   continuity between two fetches, which is why caching by id, deduplicating or invalidating
   would all be theatre, and why the local documents are kept apart from the remote ones.
3. **The dates are spread over the whole 20th century.** "Most recent first" happily sorts
   documents from 1993, and relative dates would read "32 years ago".
4. **The socket is a firehose with ghosts.** It sleeps `rand.Intn(5)` seconds between messages —
   which can be 0, so bursts — and the `DocumentID` it announces does not exist in `/documents`.

Because of (2), a stale response guard sits in the list hook: a slow first load landing after a
refresh would otherwise replace newer data with older data. Because of (4), the bell counts
instead of raising one toast per message.

### Reconnection

The socket adapter only opens the connection and translates messages. Retrying is a separate
wrapper around it, with a `1s, 2s, 4s, 8s, 15s` ladder that resets when a connection **opens**,
not when one is attempted — a socket that opens and dies a second later must not be mistaken for
one that never opened. The subscription is dropped when the app goes to the background, which
closes the socket, and reopening happens on its own when the app comes back.

## Decisions, and what was deliberately left out

- **No React Query.** One endpoint, no parameters, mutations that never reach the server (so
  nothing to invalidate) and a different random response on every call, so caching it would mean
  nothing. The data layer is 257 lines written by hand, and it does exactly what this
  server needs: timeout, tolerant parsing, partial failure, stale-response guard.
- **No global state library.** The shared state is a flat list of at most 21 items and a counter.
  Context plus hooks is enough, and adding Zustand would only move the same state somewhere else.
- **No MMKV.** `react-native-mmkv` v3 is built on Nitro Modules and does not run in Expo Go, so
  it would force a development build on a project whose persistence needs amount to a handful of
  documents. Its speed would be a premature optimisation.
- **No tactical DDD.** There is not a single invariant to protect: a document is an immutable bag
  of data. Value objects and aggregates here would be cost without benefit. The one rule that
  does exist — a document needs a title — lives in the factory function that builds it.
- **Expo Go rather than a development build.** Faster to review, at the price of ruling out local
  notifications on Android. The bell was the right feature anyway: it is what the mockup shows.
- **No notification panel, no refresh on notification, no navigation to the notified document.**
  The mockup defines none of them, and the last two would be a visual lie: refreshing returns a
  completely different random list, and the announced document id does not exist in the API.
- **"Sort by" and the list/grid toggle** from the mockup are not implemented. They are a separate
  feature, not a detail of this one.
