# rn-documents

A React Native client. It lists the documents the server
serves, lets you create your own, and tells you in real time when someone else creates one.

Built with Expo SDK 57 (React Native 0.86, React 19, TypeScript 6) and runs on **Expo Go**, so
there is nothing to compile: install the dependencies, point it at the server and open it.

## What it does

- **Lists the documents** exposed by `GET /documents`, newest first, with a loading state, an
  empty state and an error state that says what went wrong. They can be reordered by name or by
  creation date, and shown either as a list or two-up as a grid. Each card says how long ago it
  was created.
- **Goes back for more**: pull the list down to reload it. When the server cannot be reached, the
  screen says so above the documents it does have — rather than claiming there are none — and
  offers a retry.
- **Creates documents locally**, from a sheet with name, version and attachments picked
  from the device. New documents show up in the same list as the server ones, and they are still
  there after the app is closed and reopened.
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
npm test          # 145 tests, 27 suites (Jest + jest-expo + React Native Testing Library)
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

`DocumentRepository` — a single source that either answers or throws — has two adapters:

- `httpDocumentRepository` — talks to the server, with a 10s timeout and a parser that keeps the
  documents it can read and discards the ones it cannot instead of failing the whole response.
- `storedDocumentStore` — the documents you create, kept in a JSON file so they survive a
  restart. It reads that file once and writes it whenever a document is added, and it writes
  **before** it remembers: a document held in memory that never reached the disk would promise a
  permanence the app cannot deliver. `inMemoryDocumentStore` is still there for tests.

`compositeDocumentRepository` reads both at once, and it deliberately implements a **different**
port, `DocumentsReader`, because reading several sources can go half right in a way a single one
cannot. It returns `{ documents, incomplete }`: a source that fails does not sink the others, so
losing the server still shows the documents created on this device, and `incomplete` is what lets
the screen say so. Only a total failure is thrown.

That distinction was not there at first, and the cost of not having it showed up the moment the
server was killed with the app running: the screen said "There are no documents yet", which is a
convincing lie — the local store had answered, with nothing. Degrading silently is worse than
failing, because the user cannot tell the difference.

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

A partial reading is drawn as a warning above whatever could be read, with a retry beside it.
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
  nothing. The data layer is 252 lines written by hand, and it does exactly what this
  server needs: timeout, tolerant parsing, partial failure, stale-response guard.
- **No global state library.** The shared state is a flat list of at most 21 items and a counter.
  Context plus hooks is enough, and adding Zustand would only move the same state somewhere else.
- **`expo-file-system` for persistence, not MMKV or AsyncStorage.** `react-native-mmkv` v3 is
  built on Nitro Modules and does not run in Expo Go, so it would force a development build for
  a speed nobody here can measure. AsyncStorage would work, but it is a third-party package that
  still leaves the JSON to us, so it buys a few lines. `expo-file-system` is the same family as
  the Expo modules already in use, and what it does not give us — the stored shape, and the
  tolerance for a half-written file — is exactly the part worth writing and testing ourselves.
- **Relative dates written by hand, not with a library.** `Intl.RelativeTimeFormat` would have
  been free, but this Hermes build ships `Intl.Collator` and not that one — checked on the device
  rather than assumed. Of the libraries, `timeago.js` is the small one; what it solves, though, is
  locales and CLDR plural rules, and this app is in English only. Picking a unit and pluralising
  it is twenty lines and a test per boundary, so the dependency would buy nothing.
- **The stored file uses the shape the server answers with**, so `parseDocuments` reads both and
  there is one definition of what makes a document readable, rather than two to keep in step.
- **No tactical DDD.** There is not a single invariant to protect: a document is an immutable bag
  of data. Value objects and aggregates here would be cost without benefit. The one rule that
  does exist — a document needs a title — lives in the factory function that builds it.
- **Expo Go rather than a development build.** Faster to review, at the price of ruling out local
  notifications on Android. The bell was the right feature anyway: it is what the mockup shows.
- **No notification panel, no refresh on notification, no navigation to the notified document.**
  The mockup defines none of them, and the last two would be a visual lie: refreshing returns a
  completely different random list, and the announced document id does not exist in the API.
- **Only the documents created here are persisted**, never the server's answers. Every request
  returns a different random collection, so a cached copy would be a snapshot of documents that
  will never come back — presented as "your documents". Offline you see what is yours, plus the
  warning that the server could not be reached.
- **Sorting never refetches.** Picking an order rearranges the documents already on screen. Going
  back to the server would answer with a different random collection, so the list would look
  shuffled rather than sorted — the user would have asked to sort and got new data instead.
- **Neither does creating a document.** The new document is placed into the list on screen, in
  the position the active order gives it. The reload that used to follow would answer with a
  different random collection, and the whole list would change right after the user added to it.
- **Pull to refresh, and an explicit retry.** The gesture is the everyday way back to the server;
  the button is there because a gesture nobody can see is not an escape route when the screen has
  no list to pull.
- **The status bar is dark, and that is a decision Expo Go made for us.** Its background belongs
  to the host activity: `expo-status-bar` dropped `backgroundColor` in SDK 57, `androidStatusBar`
  in `app.json` only reaches a real build, and React Native's own `StatusBar` does not paint it
  either — all three were tried. So the icons are set to light, which is legible over the black
  bar Expo Go gives us, and `app.json` declares the same black for a build. Both agree instead of
  one of them looking broken.
- **Neither the order nor the layout is persisted**, the same as the notification counter: they
  describe how you are looking at the list right now, not something the app owes you tomorrow.
