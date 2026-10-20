# Design

The site has two modes that share one content file (`src/content/portfolio.js`) and
nothing else. Classic is the home page. The 3D basecamp is kept but off the page since
2026-10-20 (Zach: it took space without earning it): nothing links to it, `/?3d` still
opens it full page, and `sections/Basecamp.tsx` is ready to put back in `ClassicApp.tsx`.
Each mode is its own chunk with its own stylesheet, so the two design systems never share
a document.

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

**Physics and material, each with a job (2026-10-20 rework):**
- The showroom (`sections/Showroom.tsx`) is the Work section. On wide screens it pins, and the
  scroll opens a CSS 3D laptop: the lid swings up from lying shut while the view comes round
  from above. Once open, the screen plays the current project's recorded visit
  (`public/demos`, MP4 with a WebM copy, recorded by `scripts/capture`), and arrows, the
  ← → keys, a swipe on the screen or the strip underneath slide the screen sideways to the
  next site. It opens on the Standouts (the eight with the best demos); AI & data, Crypto,
  Sites & games and Everything are tabs on the strip. Clicking the screen of a site that
  allows framing (`EMBEDDABLE` in `lib/data.ts`) runs the live site in it. On a phone it's a
  phone that tips up as it scrolls in. Reduced motion: the laptop is simply open.
- The stack (`stack/`, `sections/Shipped.tsx`): one block per live site in a tray, oldest
  at the bottom. Kept but off the page since 2026-10-20 (Zach: too much project
  repetition); add `<Shipped />` back in `ClassicApp.tsx` to show it.
- The hanging résumé (`cloth/`): a stiff verlet sheet on two clips; pull it down and the PDF
  opens on release. "Open the résumé" is its button twin.
- Specimen Atlas, in the scroll story rather than behind every project: retinted copies of two
  styles in `specimens/modules`, fed the page's colours and a scroll value. Contour lines are
  the desk under the laptop and slide as you scroll (travel); the slime-mold agents behind
  How I build multiply as you read it (a crew of small agents building a network).
- The Work menu and the palette open the laptop on a project (`lib/launch.ts`).

**Moment:** The live line. Under the hero's buttons, the visitor's browser sends each
live site a HEAD request as the page loads, and the split-flap counter turns forward one
flap per answer. The per-site dots and times live on the Work strip, with a hover
preview of each site (the old full status board was retired on 2026-10-20: it repeated
the project list and made the hero tall).

**Interaction set:** one morphing nav panel (Work / About) · ⌘K / Ctrl K palette that falls back
to the AI · shared-element project sheets with drag-to-dismiss and `#work/<id>` links ·
layout-animated ledger filters · tool matrix that filters the work · drag-a-document
AP toy · throwable photo pile · View Transitions theme switch.

**Who:** the hero carries a portrait: two prints on the glaze, the headshot in front and a
print behind it that runs through photos from Off the clock. Tap them to swap. The pause
control's ring is the timer, and the photos hold still off screen, under a resting pointer
and with reduced motion.

**On a phone:** the glaze becomes a band across the top with the portrait on it, so the
first screen has color and a face. Navigation moves to the thumb: a dock at the bottom
names the section you're in and fills with the glaze as you read. It opens a sheet with
every section, search, the AI, the résumé and the two switches. The laptop becomes a phone
that tips up, the strip scrolls sideways, and roles open one line at a time.

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
