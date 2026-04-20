# Memory Graph — Data Ground Truth Audit

Generated 2026-04-20 against live Supabase
(`https://wofklmwbokdjoqlstjmy.supabase.co`) via the REST API with the
service-role key. Every claim below has a paired `curl` command and a
truncated sample of real returned data.

## How to re-run

```bash
set -a; source .env; set +a
# Use $SUPABASE_URL and $SUPABASE_SERVICE_ROLE_KEY below.
```

All `curl` calls below assume those two env vars are exported.

---

## Q1 — How many distinct "people" really exist?

### The claim

The graph currently renders "2 PEOPLE". The task hypothesis is that
people with `email IS NULL` or `email = ''` are being dropped by an
email-only keying strategy.

### The reality

> **Null/empty emails are NOT the cause. 0 contacts have a null or
> empty email.** The "2 PEOPLE" count reflects that only 2 distinct
> email addresses are ever referenced as `contact_id` by wa\_memories,
> and the graph filters out person nodes with zero memory edges
> (`graph-data.ts:501` — `filter((n) => n.degree > 0)`).

```bash
# Total contact rows
curl -s -I -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Prefer: count=exact" -H "Range: 0-0" \
     "$SUPABASE_URL/rest/v1/wa_contacts?select=id" | grep content-range
# → content-range: 0-22/23

# Contacts with null email
curl ... "$SUPABASE_URL/rest/v1/wa_contacts?select=id&email=is.null" | grep content-range
# → content-range: */0

# Contacts with empty-string email
curl ... "$SUPABASE_URL/rest/v1/wa_contacts?select=id&email=eq." | grep content-range
# → content-range: */0
```

### Distinct normalized emails in wa_contacts (all 23 rows)

| Count | Email |
|-------|-------|
| 13 | `aicallyu.global@gmail.com` |
| 5  | `mafaschubert13@web.de` |
| 4  | `mwg.jmschubert@gmail.com` |
| 1  | `juan@yufluence.com` |

**4 distinct emails. 0 null / 0 empty.**

### (display\_name, email, owner\_id) clusters

Same email + same owner\_id rows are duplicates of the same
person-avatar relationship created on different joins. Same email +
different owner is the same person spoken to by multiple avatars.

```
  3  dn='Manuel Jimenez'          email='aicallyu.global@gmail.com'  owner=7ea747f5…
  5  dn='Juan Flores'             email='aicallyu.global@gmail.com'  owner=7ea747f5…
  1  dn='Diego Morales'           email='juan@yufluence.com'         owner=1d4651eb…
  1  dn='Juan Schubert'           email='aicallyu.global@gmail.com'  owner=19fa8767…
  1  dn='aicallyu global'         email='aicallyu.global@gmail.com'  owner=537258b2…
  1  dn='aicallyu.global@gmail.com' email='aicallyu.global@gmail.com' owner=3a23aed6…
  1  dn='aicallyu.global@gmail.com' email='aicallyu.global@gmail.com' owner=25f6b32b…
  1  dn='Manuel Jimenez'          email='mwg.jmschubert@gmail.com'   owner=19fa8767…
  1  dn='Manuel Jimenez'          email='mwg.jmschubert@gmail.com'   owner=3a23aed6…
  1  dn='Manuel Jimenez'          email='mwg.jmschubert@gmail.com'   owner=7ea747f5…
  1  dn='Manuel Jimenez'          email='mwg.jmschubert@gmail.com'   owner=1d4651eb…
  1  dn='Maria Schubert'          email='mafaschubert13@web.de'      owner=1d4651eb…
  1  dn='Maria Schubert'          email='mafaschubert13@web.de'      owner=3a23aed6…
  1  dn='Maria Schubert'          email='mafaschubert13@web.de'      owner=19fa8767…
  1  dn='Maria Schubert'          email='mafaschubert13@web.de'      owner=7ea747f5…
  1  dn='aicallyu global'         email='aicallyu.global@gmail.com'  owner=24adf5a1…
```

Worth noting: `aicallyu.global@gmail.com` is clearly a **shared test
mailbox** used under many different display names (Manuel Jimenez,
Juan Flores, Juan Schubert, aicallyu global, aicallyu.global@…). Email
alone collapses them into one "person", which may or may not be the
desired semantic — Step 1's rule explicitly locks this in: "Contacts
that share the same normalized email are aggregated as ONE person."

### Why the graph says "2 PEOPLE"

Of 23 contacts, only 11 non-null `contact_id`s are ever referenced by
`wa_memories`:

```bash
curl -s ... "$SUPABASE_URL/rest/v1/wa_memories?select=id,contact_id&limit=1000" \
  | jq -r '.[].contact_id' | sort | uniq -c | sort -rn
#   86 31726b3d-3bdf-4fb9-a6fc-b6d194041a44  (Manuel Jimenez / aicallyu)
#   47 f0ec9fb3-a94f-4de0-86a3-a54e65270169  (Maria Schubert)
#   33 null
#   12 6003fc4d-c496-42b4-883b-9604e802a8d8  (Maria Schubert)
#   12 f41f3865-2dac-4570-bd86-75b0e62e1cc7  (aicallyu global / aicallyu)
#    6 10092a52-6335-42a2-9600-504d52314b75  (aicallyu.global@.../aicallyu)
#    6 b853b186-ec1e-4348-9660-ac96a489006b  (Maria Schubert)
#    4 7e609db1-e8c2-421e-83bb-2c9f13ac32bd  (Maria Schubert)
#    3 d7693f1c-70b0-42e9-8147-2016f2079bff  (Maria Schubert)
#    2 a656181d-8c43-49af-95e2-3ce4f8c411ce  (aicallyu.global@.../aicallyu)
#    1 fe9b23c4-d1a4-40ea-a9c8-cc0644383d5b  (aicallyu global / aicallyu)
#    1 04c83aac-3222-4f02-bbac-49656136825f  (Juan Schubert / aicallyu)
```

Group those 11 contact\_ids by email:
- `aicallyu.global@gmail.com`: 6 contacts → 1 person (Manuel/Juan/Juan Schubert/aicallyu global mashed together)
- `mafaschubert13@web.de`: 5 contacts → 1 person (Maria Schubert)

The other 2 emails (`mwg.jmschubert@gmail.com`, `juan@yufluence.com`)
are never referenced by any memory, so their person nodes end up with
`degree = 0` and are filtered out.

### Step 1 implication

Adding display\_name fallback keying will **NOT** change the "2 PEOPLE"
count because there are no empty emails. The count of people rendered
is driven by the `degree > 0` filter on `personNodes`, which is the
intended behavior (an orphaned person with no memory edges is not
useful on the graph). The header will continue to say "2 people" and
that is the correct reflection of reality: two email addresses have
memories attached. Step 1's keying change is still a latent-defect fix
for the case where `wa_contacts` grows a null-email row — but it does
not change today's numbers.

---

## Q2 — What is really inside wa\_messages?

### Schema

```bash
curl -s ... "$SUPABASE_URL/rest/v1/wa_messages?limit=1"
# → {"id":"98f2575f-5795-4101-bac5-57e13e4d3968",
#    "conversation_id":"5becace3-31c1-4197-a963-a82ba25b2472",
#    "sender":"avatar","type":"text",
#    "content":"Adri got distracted for a second. Back shortly!",
#    "media_url":null,"duration_sec":null,
#    "created_at":"2026-03-31T11:05:02.303207+00:00","read_at":null}
```

### Totals

| Segment | Count |
|---|---|
| All `wa_messages` | **1236** |
| `sender = 'contact'` | **432** |
| `sender = 'avatar'` | **804** |

### Type breakdown

```
sender=contact (432)    voice=294   text=123   video=14   image=1
sender=avatar  (804)    text=527    voice=277
```

### Content patterns — sender = 'contact'

```bash
curl -s ... "$SUPABASE_URL/rest/v1/wa_messages?select=type,content&sender=eq.contact&limit=30"
```

Real samples (truncated):

| Type | Content |
|------|---------|
| voice | "Wenn ich die Realität sage, auch wenn ich täglich eine Stunde blockieren…" |
| voice | "¿Qué fue, hermano? Mira, acabó de pasar el primer error…" |
| text  | "Hey! Nice to get here! How are you doing?" |
| text  | "hey" |
| text  | "hola" |
| voice | "¿Cómo que seguimos conversando después? Si te acabo de decir que…" |
| text  | "Elena, what's your expertise?" |
| voice | "I'm not sure this approach is going to work..." (x 4 — test data) |

**Verdict:** `sender='contact'` content is *real human communication*
— either typed text ("hey", "hola", "Elena, what's your expertise?")
or transcribed speech from voice notes. There are **no** synthetic
system events like "Call started" emitted on the contact side.

### Maria never types

Filtering to Maria-tied contact\_ids
(`d7693f1c`, `7e609db1`, `b853b186`, `6003fc4d`, `f0ec9fb3`):

| contact\_id | contact voice | contact text |
|---|---|---|
| d7693f1c | 5 | 1 |
| 7e609db1 | 6 | 0 |
| b853b186 | 2 | 0 |
| 6003fc4d | 4 | 0 |
| f0ec9fb3 | 2 | 0 |
| **TOTAL** | **19** | **1** |

> **Hypothesis confirmed.** Across ~1000 of 1236 messages sampled,
> Maria's side is 19 voice + 1 text. Labeling her tile as "text
> messages" is misleading.

### Content patterns — sender = 'avatar'

```bash
curl -s ... "$SUPABASE_URL/rest/v1/wa_messages?select=type,content&sender=eq.avatar&limit=1000"
```

Of 804 avatar-sent rows:
- **187** start with `[Call summary] {...}` — these are **synthetic
  post-call JSON dumps** posted into the conversation as a text
  message, not things the avatar "said" during chat.
- **12** start with `[TTS ERROR: ...]` — synthesized TTS failure
  messages.
- The rest (~605) are real typed/TTS replies, often with stage
  directions like `[softly]`, `[light chuckle]`, etc.

> **Consequence for the person panel.** If we bucket wa\_messages into
> a per-person "Chat Events" number, we should exclude `[Call summary]`
> on the avatar side because those represent video calls we already
> count separately via `call-anima-api-*`. On the contact side there
> are no system events to exclude.

---

## Q3 — wa\_memories.connections health

### Claim (from task)

99% of memories have populated connections, avg ~2 connections each,
and some `linked_to` ids reference memories that don't exist.

### Reality

```bash
curl -s ... "$SUPABASE_URL/rest/v1/wa_memories?select=id,connections&limit=500"
```

- Total memories: **213**
- Memories with populated connections: **210 / 213 (98.6%)** ✓
- Connections shape: always a JSON array of
  `{"linked_to": <int>, "relationship": "<text>"}`
- Total connection refs: **421**
- Avg connections per memory (non-empty only): **2.00** ✓
- **Broken refs (`linked_to` → memory id not in the table): 1**
  — memory `id=36` connects to `linked_to=37`, but `id=37` does not
  exist in `wa_memories`.

### Memory id type

`wa_memories.id` is a **bigint integer**, not a UUID
(e.g. `"id": 5`). This matters — graph-data.ts currently builds
memory node ids as `memory:${memId}` with `memId = String(memory.id)`,
so nodes are keyed `memory:5`, `memory:213`, etc. If we wire up
`connections`, we will need to match `linked_to` against the same
string-stringified integer.

Note: graph-data.ts does NOT currently use the `connections` column at
all — it builds memory–memory edges purely by "two memories sharing
≥2 topics". The data is sitting unused.

---

## Q4 — Cross-contact and cross-avatar connections

Joining memory → `contact_id`/`persona_name`/`owner_id` via the 421
`connections` refs:

| Bucket | Count |
|---|---|
| Same contact\_id on both sides | **330** |
| Different contact\_id | **52** |
| One side has `contact_id = null` | 38 |
| Broken / missing row | 1 |

| Bucket | Count |
|---|---|
| Same avatar (persona\_name or owner\_id) | **318** |
| Different avatar | **102** |

> ~12% of connections cross people, ~24% cross avatars. Most memory
> linking happens within the same (person, avatar) pair — but a
> non-trivial minority are cross-pollinating, which is the most
> interesting data for a graph to surface.

---

## Q5 — Top 30 topic strings

```bash
curl -s ... "$SUPABASE_URL/rest/v1/wa_memories?select=id,topics&limit=500"
# topics shape: array of strings, e.g. ["Behavioral Analysis", "Session Summary", ...]
```

Across 213 memories: **810 topic occurrences, 462 distinct strings**.

### Top 30

| N | Topic | Generic? |
|---|-------|----------|
| 68 | `Behavioral Analysis` | **Generic** |
| 43 | `behavioral analysis` | **Generic** (casing dup) |
| 30 | `Behavioral analysis` | **Generic** (casing dup) |
| 24 | `behavioral_analysis` | **Generic** (casing dup) |
| 15 | `OPM` | **Generic** |
| 11 | `Communication` | **Generic** |
| 10 | `OPM findings` | **Generic** |
| 10 | `Voice message` | **Generic** |
| 7  | `Relationships` | Semi-generic |
| 6  | `behavioral-analysis` | **Generic** (casing dup) |
| 6  | `OPM_findings` | **Generic** (dup) |
| 6  | `cognitive load` | Semi-generic |
| 5  | `Authenticity` | Content-specific |
| 5  | `conversation` | **Generic** |
| 5  | `Human-AI Interaction` | Semi-generic |
| 4  | `session_log` | **Generic** |
| 4  | `Juan Schubert` | Content-specific |
| 4  | `emotional state` | Content-specific |
| 4  | `persona interaction` | Semi-generic |
| 4  | `Conversation` | **Generic** (casing dup) |
| 4  | `Curiosity` | Content-specific |
| 4  | `Emotional Expression` | Content-specific |
| 3  | `Cognitive Load` | Semi-generic (casing dup) |
| 3  | `user_feedback` | **Generic** |
| 3  | `session_data` | **Generic** |
| 3  | `Psychology` | Content-specific |
| 3  | `Inheritance` | Content-specific |
| 3  | `Spanish` | Content-specific |
| 3  | `Emotions` | Content-specific |
| 3  | `Personal reflection` | Content-specific |

### Observations

1. **"Behavioral Analysis" dominates** — 171 occurrences once you
   fold casing variants together. That is **81% of memories**. Any
   memory-memory edge that uses this topic will hairball the graph.
2. graph-data.ts already calls `norm(topic)` (lowercase +
   alphanumeric-only), so all five "behavioral analysis" variants
   collapse to one key for edge-building. Good.
3. The "memory-memory edge = 2+ shared topics" rule is too permissive
   given the topic distribution. Consider filtering out a blocklist
   of generic topics (`Behavioral Analysis`, `Session Summary`,
   `OPM`/`OPM findings`, `Voice message`, `Conversation`,
   `session_log`, `session_data`, `user_feedback`) before pairing,
   or weighting topics by inverse frequency.

---

## Summary of actionable findings for later steps

1. **Step 1 caveat** — the `null email → display_name fallback` rule
   will not change today's person count. The "2 PEOPLE" reflects how
   few distinct emails have memories (`degree > 0` filter). This is
   the correct number, not a bug.
2. **Step 2 renaming** — "text messages" is misleading on Maria's
   tile because her ratio is 19 voice : 1 text. A mixed label like
   "Voice Notes" / "Chat Messages" (split, not lumped) is more
   honest. Also: avatar-side messages need `[Call summary]` excluded
   or they double-count video calls.
3. **Connections data is unused** — 421 `linked_to` refs currently do
   not drive any edges. Wiring them up gives the graph real
   relationship signal instead of noisy topic co-occurrence.
4. **Topic noise** — `Behavioral Analysis` appears on 81% of
   memories. Topic-only edges will need a generic-topic blocklist.
5. **Broken ref** — 1 of 421 `linked_to` targets (memory 36 → 37)
   points to a non-existent memory. Guard against missing refs when
   rendering connection edges.
