# Design

The site has two modes that share one content file (`src/content/portfolio.js`) and
nothing else. Classic is the home page; the 3D basecamp opens in a window on it (an
iframe, loaded on request) or full page at `/?3d`. Each mode is its own chunk with its
own stylesheet, so the two design systems never share a document.

---

# Identity — Classic · The operating statement

**Concept:** A builder's operating statement: Stripe-grade product pages with the
rigour of a closed set of books. Every claim ties out to something live, and the
hero proves it in real time.

**Palette** (OKLCH tokens in `src/classic/styles/classic.css`, AA-checked in both themes):
- `ledger paper` `#fcfbf9` — ground; `paper-2`/`paper-3` for sections and insets
- `statement ink` `#1b1612` — text; `ink-2`/`ink-3` warm-biased secondaries
- `terminal amber` `#f69835` — the one accent: the Bloomberg screen, and the brand's amber
- `close vermilion` `#e54728` + `oxblood` `#5b1e23` — the gradient's heat and depth, hero and closing rule only
- `tick green` `#359658` — reserved for "live", never decoration
- `terminal` `#130e0b` — the status board, dark in both themes
- Dark theme, "after hours": the same roles on warm near-black

**Type:** Mona Sans (variable width) for everything set in words: headers at 112–118%
width, working text at 100%. JetBrains Mono for every measured number and label.
Caveat only for the handwritten notes in "Show the work".

**Mood:** C55 / B30 / A15 — exact, warm, alive.

**Signatures (from Atelier's motion lab):**
- `scenes/shader-gradient` — the hero's WebGL slab, re-glazed oxblood → vermilion → gold (`engines/shader-gradient.js`, vendored)
- `typography/split-flap` — the status board's live counter (`engines/split-flap.ts`)
- `scroll/line-draw` — the experience rule that draws as you read, roles latch and stay lit (Motion `useScroll`)
- `typography/hand-annotation` — "Show the work": seeded pencil marks and margin notes (`engines/ink.ts`)
- plus `motion/spring-presets` as the motion language (`lib/motion.ts`), not a visible signature

**Moment:** The status board. The visitor's browser sends each of the 14 live sites a
HEAD request as the page loads; rows tick green with real response times and the
split-flap counter turns forward one flap per answer. A site that's down says so.

**Interaction set:** one morphing nav panel (Work / About) · ⌘K / Ctrl K palette that falls back
to the AI · shared-element project sheets with drag-to-dismiss and `#work/<id>` links ·
layout-animated ledger filters · tool matrix that filters the work · drag-a-document
AP toy · throwable photo pile · View Transitions theme switch.

**We refuse:** purple/blue gradients · glass cards · glow blobs · floating mockups ·
centered label + italic-serif headers · "∞ problems left to solve" stats · typewriter
role loops · buzzwords.

**Fallback:** reduced motion keeps every state and drops the travel: the glaze renders
one still frame, flaps swap in place, the rule is drawn, marks appear already drawn.
No WebGL: the engine paints a CSS still in the same colors.

---

# Identity — 3D · Alpine Descent

**Concept:** A finance-forged builder's portfolio rebuilt as a cinematic dusk descent — a german shepherd walks you down an alpine trail, and each portfolio section is a lit waypoint along the way.

**Palette:**
- `summit-indigo` `#0e1524` — ground / deepest sky
- `glacier-shadow` `#1b2740` — mid depth, snow shadow
- `moonlit-snow` `#e9edf6` — snow surface / primary text
- `cabin-amber` `#e0a155` — accent (his existing brand), cabin & lantern glow
- `ember` `#c2823a` — accent-deep
- `aurora-teal` `#5fd6c4` — sky wonder / signal accent (used sparingly)
- neutrals are indigo-biased (never pure grey)

**Type:** Archivo (heavy / expanded) display + JetBrains Mono telemetry + Fraunces italic accent — expedition-map structure, instrument readouts (altitude, waypoint no.), and one editorial human voice. Grotesk-led, distinct from serif-led recent builds.

**Mood:** A70 / cinematic — hushed, cold-wonder, premium.

**Signatures (≤4):**
- `surface/glassmorphism` — frosted waypoint panels over the live snow world
- `surface/grain-noise` — film texture over everything (engine-native)
- `scroll/scroll-reveal-stagger` — panel content rhythm
- `pointer/magnetic-button` — Enter / waypoint / contact CTAs

**Moment (the one bold move):** the shepherd descending moonlit snow — cabin windows and trail lanterns igniting and *staying lit* as it passes, aurora breathing overhead, arriving at the trailhead. The whole site *is* the scroll-driven 3D walk.

**Waypoints (the descent, high → low):**
1. Summit / Title — hero (name, roles, Enter)
2. The Overlook — About (bio, traits, education)
3. Basecamp Cabin — Projects (10 live, windows glowing)
4. The Ascent — Experience (trail markers = 7 roles)
5. The Kit — Skills (gear cache)
6. Frozen Lake — Life (8 photos, aurora reflection)
7. Trailhead — Contact (signpost + AI chat)

**We refuse:** purple→blue gradients · Inter-for-everything · rounded-card sameness · emoji section markers · ski-resort stock photography.

**Fallback:** full reduced-motion / no-WebGL path renders the same palette, type, and all real content as a clean vertical scroll — the identity survives with motion off.
