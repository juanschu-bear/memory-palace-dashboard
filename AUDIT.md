# Code Quality Audit

Scope: everything except `/graph` route. (No `GraphView.tsx` / `graph-data.ts`
exist on this branch, so nothing was touched.)

Tooling baseline before the sweep:

- `tsc -b` → clean
- `vite build` → clean (287 kB bundle, 48 kB CSS)
- `eslint` config is set up but not enforced in CI scripts

Findings are grouped by severity. Items labelled **[FIXED]** were addressed in
this sweep; **[TODO]** are left as a checklist.

---

## Critical

1. **[FIXED] SPA-breaking navigation in every HTML-driven page.**
   `Entrance.tsx`, `Wing.tsx`, `Room.tsx`, `Diary.tsx`, `Tunnels.tsx`,
   `Skills.tsx`, `Contacts.tsx` all ship big `dangerouslySetInnerHTML`
   blocks containing plain `<a href="/...">` breadcrumbs, back buttons,
   diary links, bottom-nav links, and palace-entrance links. Clicking any
   of them triggered a full-page reload instead of client-side navigation.
   `Wing.tsx` also used `window.location.assign` on room doors.

2. **[FIXED] Dead `<script>` tag in `Skills.tsx`.**
   React does not execute scripts injected via `dangerouslySetInnerHTML`,
   so the background starfield generator never ran. The `#starfield` div
   was silently empty in production.

3. **[FIXED] `Contacts.tsx` breadcrumb "Palace" had no `href`.**
   `<a>Palace</a>` rendered as dead text styled like a link.

4. **[FIXED] `Contacts.tsx` header claimed `49 memories stored` — hardcoded.**
   The live contacts/sessions counts were wired up, but the memories total
   was a literal `49`. Replaced with the real `memories.length`.

5. **[FIXED] `Entrance.tsx` hardcoded every avatar corridor + stat.**
   All six corridors were inlined in the HTML string (names, roles, the
   `49 / 0 / 0 / 0 / 0 / 0` memory counts, and `42 Rooms`). If
   `AVATARS` or `STANDARD_ROOMS` changed, the page silently fell out of
   sync. Corridors are now generated from `AVATARS` and the `Rooms` stat
   uses `STANDARD_ROOMS.length`.

## Important

6. **[FIXED] Skills counts were inconsistent between list and detail pages.**
   `SkillsSelect` counted skills by regex-matching `skill/…` patterns in
   JSON-stringified diary entries. `Skills` (detail) counts distinct
   topics in `wa_memories`. Same avatar, different numbers. Both now use
   the memories+topics source of truth.

7. **[FIXED] `Wings.tsx` showed "No contacts found yet." while still loading.**
   Empty state was shown before the initial fetch resolved. Added a
   loading flag and a neutral loading message.

8. **[FIXED] `UserWing.tsx` rendered a fully-populated "Unknown" user while
   loading**, which made real 404s indistinguishable from loading. Now
   renders a loading state, then a proper "contact not found" state if
   the id does not resolve after the fetch completes.

9. **[FIXED] `UserWing.tsx` undercounted "Avatars met".**
   Only conversation `owner_id`s were collected; memory `owner_id`s were
   ignored. Memories with no matching conversation were invisible.

10. **[TODO] `fetchMemories` / `fetchOwners` are refetched on every
    navigation.** The same two tables are pulled from Supabase from
    Entrance, Wings, RoomsSelect, Room, Tunnels, TunnelsSelect, UserWing,
    Skills, and Contacts. A tiny in-module cache (or a query lib) would
    remove 8 redundant round-trips per session. Deliberately left alone
    here because it is a behavior-affecting refactor, not a bug fix.

11. **[TODO] `api/supabase.ts` proxies request bodies unconditionally.**
    For POST/PATCH it `JSON.stringify`s `req.body` even when `req.body`
    is `undefined`, which yields the string `"undefined"` upstream. Today
    the client only issues GETs so this is dormant, but it will bite the
    next person who adds a write path.

12. **[TODO] Tunnels + Skills SVGs hardcode example labels and lines.**
    `Tunnels.tsx` hard-codes the "Active tunnels" list (Trace↔Adri, etc.)
    and the `pricing` / `strategy` SVG labels. `Skills.tsx` has five
    hardcoded skill cards in the HTML template that get wiped on first
    render. Correct but wasteful; replace the template's static content
    with a single "loading" placeholder.

## Nice to have

- Data-consistency polish:
  - Entrance/Wings/Rooms/Tunnels all compute the same "memories per avatar"
    number independently. Extract a single `countMemoriesPerAvatar`
    helper.
- Type hygiene:
  - `src/lib/api.ts` and the avatar/memory helpers lean on `any[]`. Adding
    `WaMemory`, `WaContact`, `WaOwner`, `WaConversation` interfaces would
    catch schema drift (e.g. `last_active_at` vs `updated_at`).
- Accessibility:
  - `.room-door[data-route]` and `.contact-card` are clickable `div`s with
    no keyboard support, role, or focus style.
  - `.skill-detail-card` gets `tabIndex=0` but no `keydown` handler, so
    Enter/Space don't open the panel.
- DOM hygiene:
  - Seven pages use `dangerouslySetInnerHTML` + imperative DOM mutation.
    `escapeHtml` is duplicated in Contacts, Room, Diary, Skills. Pull it
    into a shared util if the pages aren't migrated to JSX.
  - Consider migrating these to JSX incrementally; the cinematic styling
    is pure CSS and doesn't depend on the HTML coming from a string.
- `index.html`: set `lang="en"` on `<html>` (currently unset).
- `eslint` isn't wired into `npm run build`; easy CI win.
- `tsconfig.app.json` has `noImplicitAny: false`, `noUnusedLocals: false`,
  `noUnusedParameters: false` — dialling these up would surface the
  `any[]` debt above.
- `AvatarSelector.AvatarCounts` interface is declared but unused.
- `TunnelsPage`'s SVG "Active tunnels" legend and node coordinates should
  live in data, not markup, so they can be filtered per-avatar.
