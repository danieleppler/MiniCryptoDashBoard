# Decisions

## Debounced search
The search input doesn't trigger a fetch on every keystroke. Changes to the text field
are held in `searchQuery` state and, after a 400ms pause with no further typing, applied
to `q` (and the page is reset to `1`). This avoids firing a request per keystroke and
only queries the API once the user stops typing.

## AbortController for in-flight requests
Each data fetch runs inside a `useEffect` keyed on `q`, `currentPage`, and `limit`. If any
of these change before the current request resolves, the previous request is aborted via
`AbortController` in the effect's cleanup function. This prevents two race conditions:
- A slow, now-stale request resolving after a newer one and overwriting fresh state with
  old data.
- Wasted work/state updates from a request whose result is no longer relevant.

`AbortError` thrown by the aborted fetch is caught and ignored rather than surfaced as a
real error.

## Server-Sent Events for live coin updates
Coin price changes need to reach every open dashboard without clients polling for them.
Rather than have the frontend re-fetch on an interval, the backend pushes updates over a
one-way SSE stream:
- `GET /coins/stream` opens a long-lived `text/event-stream` response. The response object
  is registered in an in-memory `Set<Response>` (`back/sse.ts`) and removed when the
  request closes (`req.on('close', ...)`), so disconnected clients don't leak.
- `broadcast(event, data)` writes a `coin-update` SSE frame to every registered client,
  serializing `data` as JSON in the `data:` field.
- The frontend opens the stream once on mount with `EventSource` and merges each
  `coin-update` payload into the existing `coins` state by `coinId`, instead of refetching
  the whole page.

SSE was chosen over WebSockets because the data only flows server -> client (no client
messages needed) and over polling because it avoids repeated full-list requests just to
catch an occasional price change.

Tradeoff: `clients` is a process-local `Set`, so this doesn't fan out across multiple
server instances/processes. Fine for a single-instance setup; would need a pub/sub layer
(e.g. Redis) to scale horizontally.

## PATCH /coins/:coinId as the update trigger
Updating a coin's value is a plain REST PATCH (`back/index.ts`): it validates `coinId` and
`coinValue` with zod, mutates the matching coin in place (updating `coinValue` and
`lastUpdate`), then calls `broadcast('coin-update', coin)` before responding.

This keeps the write path and the notification path in the same request: anyone calling
PATCH gets a normal HTTP response, and every other connected client gets the same update
pushed via SSE immediately after. The PATCH handler is the only place `broadcast` is
currently called, so it's also the only source of `coin-update` events.

## Repository pattern for coin data access
Route handlers in `back/index.ts` used to import the `coins` array from `back/data/coins.ts`
directly and read/mutate it in place (`.find`, `.filter`, assigning `coin.coinValue`). That
ties every handler to the specific shape of the in-memory store.

`back/repositories/coinRepository.ts` now sits between the routes and the data:
- `CoinRepository` is an interface (`findAll`, `findById`, `updateValue`).
- `InMemoryCoinRepository` implements it over the `coins` array from `back/data/coins.ts`.
  `updateValue` is where `coinValue` and `lastUpdate` get mutated, not the route handler.
- A single `coinRepository` instance is exported and imported by `back/index.ts`; routes no
  longer import `coins` at all.

This is just an abstraction boundary, not a new persistence mechanism - the data is still
the same in-memory array. The payoff is that swapping the array for a real database later
only means writing a new `CoinRepository` implementation; route handlers and validation
stay untouched.

## DTOs and zod validation at the API boundary
`back/modals/coinDto.ts` defines the shapes that cross the HTTP boundary (`coinDto`,
`coinReponseDto`), separate from `back/modals/coin.ts`'s domain `coin` type. The DTO is
what the repository returns and what routes send back - it's the contract with the
frontend, so it can evolve independently of whatever the storage layer looks like
internally.

Validation of anything coming from the client happens with zod schemas defined alongside
the routes in `back/index.ts`:
- `coinsQuery` - `page`/`limit`/`search` on `GET /`, with `z.coerce` turning query-string
  values into numbers and defaults (`page=1`, `limit=10`) applied when absent.
- `coinIdParam` - `coinId` on `PATCH /coins/:coinId`, coerced to a positive int.
- `updateCoinBody` - `coinValue` on the same route, coerced to a positive number.

Each route calls `.safeParse` (never the throwing `.parse`) and returns `400` with
`parsed.error.issues` directly if validation fails, before any repository/business logic
runs. This keeps "is the request well-formed" entirely separate from "does the thing it's
asking about exist" (which is a `404` from the repository instead, e.g. updating an
unknown `coinId`) and from unexpected failures (which fall through to the `errorHandler`
middleware and come back as `500`/`400` depending on the error, not here).
