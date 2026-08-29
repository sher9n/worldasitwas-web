# World As It Was design

Direction: **Archive**. This is the web translation of the app's chosen theme (option `1a`) so
`worldasitwas.com` and the app read as one product. The site is static and lives in its own
repo; nothing here depends on the app's code.

The app is the source of truth for these values. If a token changes there, change it here.

**One file, two themes.** This document now covers the dark theme (the original direction, and
still the default) and the light theme. Anything not marked as theme specific applies to both.

---

## 1. The idea to hold

**Arrival, not browsing.** The page's job is to make someone want to be somewhere, not to
read about an app. Copy says *"Take me to London in 1850"*, never *"Learn about Victorian London"*.

**The tension is the design.** A map interface is cold, functional, blue-grey. The content is
warm, atmospheric, historical. The app resolves this by keeping the map plain and putting all
identity on top of it. The site inherits the same rule: structure is quiet and functional,
warmth comes from type, imagery and one accent.

**Confidence is a feature, not a disclaimer.** Known / Likely / Generated appear on the
marketing site the same way they appear in the product. Do not hide them in a footnote and do
not apologise for them.

**Honesty about what exists.** Unbuilt eras say "in the archive". The light tour is labelled
generated. The roadmap carries no dates. The footer says the privacy and account deletion
pages are not written yet rather than linking to nothing. This is a design rule, not a
content accident: it is the same promise the confidence tiers make, applied to the product.

---

## 2. Themes

### 2.1 Why there is a light theme at all

The first version of this brief said not to build one, on the grounds that a bright site
handing off to a dark app breaks the arrival. We built one anyway, and the answer to that
objection turned out not to be "keep half the page dark" but "commit". A page that is dark in
patches reads as broken, not as atmospheric.

Dark is still the default and still the brand. Light is for daylight, for projectors, and for
people who read long pages more comfortably on paper.

### 2.2 How the theme is chosen

Three states, in priority order:

1. **Pinned.** The reader used the toggle. Stored in `localStorage` under `waiw-theme` and
   applied as `data-theme` on `<html>` by a small script in `<head>`, before first paint, so
   there is no flash of the wrong theme.
2. **System.** No pin, so `prefers-color-scheme` decides. This is pure CSS and needs no
   JavaScript at all.
3. **Default.** Neither of the above resolves to light, so dark.

`color-scheme` is set per theme so form controls, scrollbars and the like follow. Two
`theme-color` meta tags carry the browser chrome colour, one per scheme; when a theme is
pinned the script flips their `media` attributes rather than adding a third tag, because the
browser uses the first tag whose media matches.

### 2.3 Both themes go all the way

**Nothing stays dark in light mode.** Not the hero, not the phone mock, not the plates, not
their captions, not the SVG map. If you add a component that looks right in only one theme,
it is not finished.

That has three consequences worth knowing before you touch anything visual:

- **Every plate exists twice**, a dark-toned file and a light-toned one. See section 7.
- **The SVG map is styled from CSS**, never from `fill` attributes, so it follows the theme
  like any other component. Its classes are `.m-ground`, `.m-park`, `.m-water`, `.m-blocks`,
  `.m-streets`, `.m-road`, `.m-route`, `.m-stops`, `.m-pin`, `.m-halo`, `.m-chip`,
  `.m-chip-text` and `.m-label`.
- **Scrims are tokens**, not literals. `--hero-scrim`, `--plate-scrim` and `--viewer-scrim`
  each fade to their theme's ground, which is what lets a caption sit on an image and still
  take its colour from `--text-meta` in both themes.

## 3. Palette

Two grounds maximum per page: the page ground plus one recessed ground. Cards, header and
footer are surfaces on top of those, not a third ground.

### 3.1 Dark theme (default)

Ratios measured against `#07090d`.

| Role | Value | Use | Contrast |
|---|---|---|---|
| `--ground` | `#07090d` | Page ground. The default. | n/a |
| `--ground-recessed` | `#0b0e14` | Recessed sections, image wells, map fields | n/a |
| `--surface` | `#11151c` | Cards, panels, sticky header, footer | n/a |
| `--hairline` | `rgba(244,236,216,.10)` | All dividers and card borders | n/a |
| `--accent` | `#e8b86a` | Actions, live state, Known tier, era numerals | 10.9:1 |
| `--accent-on` | `#11151c` | Text on an amber fill | 10.0:1 on amber |
| `--text` | `#f4ecd8` | Primary text, headings | 16.9:1 |
| `--text-2` | `#cbd1de` | Secondary text, subtitles | 13.0:1 |
| `--text-meta` | `#7d8597` | Meta, mono labels, timestamps | 5.4:1 |

### 3.2 Light theme

Warm parchment, not white. Ratios measured against `#f7f2e7`.

| Role | Value | Use | Contrast |
|---|---|---|---|
| `--ground` | `#f7f2e7` | Page ground | n/a |
| `--ground-recessed` | `#efe8d7` | Recessed sections | n/a |
| `--surface` | `#fffdf8` | Cards, panels, header | n/a |
| `--footer-ground` | `#ece5d3` | Footer, one step deeper than recessed | n/a |
| `--hairline` | `rgba(20,17,12,.14)` | Dividers and card borders | n/a |
| `--accent` | `#9a5f1e` | Accent **fills** only (buttons, the slider thumb) | 4.7:1 |
| `--accent-text` | `#8a5a1f` | The accent used as **text**: links, numerals, status | 5.3:1 |
| `--accent-on` | `#fffdf8` | Text on a bronze fill | 5.1:1 on bronze |
| `--text` | `#14110c` | Primary text, headings | 16.9:1 |
| `--text-2` | `#4c4636` | Secondary text | 8.4:1 |
| `--text-meta` | `#625b4c` | Meta, mono labels | 6.0:1 |

Three light-theme traps, all of them measured:

- **Amber does not survive on paper.** `#e8b86a` is about 2:1 on cream. Bronze replaces it
  everywhere in light mode, including inside the phone mock.
- **Fill bronze and text bronze are different values.** `#9a5f1e` is 4.3:1 on the recessed
  ground, which fails, so it is used only as a fill where its own contrast does not apply.
  `#8a5a1f` clears 4.5:1 on all three light grounds and is the one you write text in.
- **`--paper` is not the label colour for a bronze button.** `#f4ecd8` on `#9a5f1e` is 4.43:1
  and fails. Use `#fffdf8`.

### 3.3 The accent rule, unchanged

**Amber, and its light-theme counterpart bronze, are not decoration.** They mark exactly three
things: something you can act on, something that is live or ready, and the Known confidence
tier. If the accent appears anywhere else on a page, remove it. Never as a large fill behind
text, never as a gradient, never two accents at once.

---

## 4. Typography

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,300;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

**Cormorant Garamond italic** is the display face. It is used for **places, years and titles
only**, such as "London", "1850", "Fleet Street". Never for body copy, never for UI labels,
never for buttons. Weight 300 at large sizes, 400 below about 40px (300 gets too thin).

**Inter** is everything else: body, labels, buttons, navigation.

**A monospace** (`ui-monospace, SFMono-Regular, Menlo, monospace`) carries data: coordinates,
stop counts, durations, confidence labels, era status. Always uppercase, always letter-spaced,
always `--text-meta`. This is what makes the archive feel like a record rather than a brochure.
The one exception is the store label "iOS", which keeps its own casing.

| Role | Family | Spec |
|---|---|---|
| Display 1 | Cormorant Garamond italic 300 | `clamp(52px, 7.5vw, 96px)` / 1.02 / `-0.015em` |
| Display 2 | Cormorant Garamond italic 300 | `clamp(34px, 4.4vw, 56px)` / 1.06 / `-0.01em` |
| Era numeral | Cormorant Garamond italic 400 | 40 to 56px / 1 / accent |
| Section title | Cormorant Garamond italic 400 | 28 to 34px / 1.15 |
| Lede | Inter 400 | 19px / 1.6 / `--text-90` |
| Body | Inter 400 | 16.5px / 1.7 / `--text-86` |
| Small | Inter 400 | 13.5px / 1.5 / `--text-2` |
| Button | Inter 600 | 15px / 1 |
| Eyebrow | Inter 500 | 11px / 1 / `0.16em` / uppercase |
| Meta | mono 400 | 11px / 1.5 / `0.12em` / uppercase / `--text-meta` |

Body measure caps at **62ch**. `text-wrap: pretty` on every paragraph, `text-wrap: balance` on
headings. Minimum body size on the site is 16px; never set mono below 10px.

---

## 5. Layout

- Content max width **1180px**; a 12-column grid with a 24px gutter, collapsing to 1 column
  under 760px.
- Section rhythm: **112px** vertical padding desktop, 72px tablet, 48px mobile. One divider
  hairline between major sections, or none, never both a divider and a background change.
- Spacing scale, 4px base: 4, 8, 12, 16, 20, 24, 32, 48, 64, 96, 112.
- Radii: **12px** buttons and fields, **20px** cards and panels, **6px** chips and pin labels,
  50% for map pins and play buttons. Nothing else.
- Shadows are for elevation off the ground only: `0 -22px 60px rgba(0,0,0,0.62)` for a panel
  rising, `0 2px 10px rgba(0,0,0,0.6)` for a pin. In light mode shadows soften and warm
  (`--shadow-lift`, `--shadow-pin`), because a hard black shadow on parchment looks like dirt.
  No coloured shadows, no glow except the accent pin halo.
- Err heavily toward whitespace. A section that feels empty is a layout problem, not a
  content gap, so do not fill it with feature cards.
- Every interactive target is at least 24px tall, including inline navigation and footer links.

---

## 6. Components

**Hero.** Full-bleed, one period plate behind a vignette
(`inset 0 0 130px 30px rgba(7,9,13,0.9)`) and a top scrim
(`linear-gradient(#07090d, rgba(7,9,13,0.72) 42%, transparent)`). Display 1 in Cormorant italic
carrying a place and a year. One amber call to action. One line of mono underneath stating what
exists today, honestly: `LONDON 1850 · 6 STOPS · 42 MIN · FREE`. On a narrow screen the
horizontal scrim lightens, because a phone viewport is almost entirely the left-hand edge of
that gradient and the plate disappears behind it.

**Theme toggle.** One 42px icon button in the header, showing the theme you can switch **to**:
a sun while you are in dark, a crescent while you are in light. The icon swap is pure CSS on
the same cascade as the palette, so it is correct before any JavaScript runs; the script only
keeps `aria-label` and `title` in step. Below 560px the header's call to action is hidden and
the toggle stays, because the hero's call to action is one scroll away.

**Primary button.** Accent fill, `--accent-on` text, Inter 600 15px, height 48px (44px minimum
touch target), radius 12px. Hover lightens in dark, deepens in light. There is one primary
button per view.

**Secondary button.** Transparent, 1px `--border`, `--text`.

**Era card.** `--surface` ground, hairline border, radius 20px. Layout is a fixed-width
numeral column (74px, accent Cormorant italic) beside a stack: title in Inter 500 15px,
description in Inter 13px `--text-2`, then a mono status line. Three states, visually
distinct:

| State | Numeral | Status line | Action |
|---|---|---|---|
| Ready | accent | `6 STOPS · 42 MIN · FREE` in `--accent-dim` | Accent **Travel** button |
| In the archive (not built) | `--text-50` | `IN THE ARCHIVE` in `--text-meta` | Outline **Notify me** |
| Available later (will cost) | `--text-50`, row at 62% opacity | `AVAILABLE LATER` plus padlock | none |

Those last two must never look the same. Not-built is a promise; will-cost-later is a fence.
Only the first two states are on the site today.

**Era scrubber.** The one interactive piece, and the site's translation of the app's time
slider. A real `<input type="range">` drives it, so keyboard and assistive technology work
without extra code; the year buttons underneath set the same state and mark the current one
with `aria-current`. Changing the year crossfades the plate over 420ms and rewrites the
arrival record beside it. The accent appears twice here and both are legitimate: the slider
thumb is the live position, and the active year label is the live state.

**Arrival record.** A `--surface` card holding a definition list: mono label, then the value
with its confidence marking. It is deliberately **not** a screenshot of the app's arrival
screen, which is not designed yet. It is a record, on the page, in the page's own type.

**Confidence legend.** The marking is on the phrase itself, not in a badge:

```css
.known     { text-decoration: underline; text-decoration-color: var(--known-line);
             text-underline-offset: 3px; color: var(--text-90) }
.likely    { text-decoration: underline dashed var(--likely-line);
             text-underline-offset: 3px; color: var(--text-84) }
.generated { text-decoration: underline dotted var(--generated-line);
             text-underline-offset: 3px; color: var(--text-74) }
```

Text opacity steps down with certainty: 90 / 84 / 74 in dark. In light the same three steps are
raised to 92 / 86 / 78, because on paper a low alpha goes pale and thin far faster than it goes
dim on ink. Any page showing narration also shows the three-item legend beneath it: a 15px rule
in the matching style plus a mono label.

**Light tour.** Where a city is not built, the honest offer is three generated stops rather than
an empty result. On the site it is labelled the same way it is in the app: `LIGHT TOUR ·
3 GENERATED STOPS`. Do not dress it up as equivalent to a reconstruction.

**Waitlist.** The apps are not in the stores, so the page does not pretend they are. The
download section is a form: one email field on `--surface`, three radio choices for the phone,
one primary button, and a mono note stating exactly what the address is used for. On success
the field and the button are removed and the status line replaces them, so there is nothing
left to submit twice. Failures speak plainly and never blame the reader. The form carries a
hidden `company` field that a person never sees; anything that fills it is treated as a bot and
silently accepted without a write.

**Footer.** `--footer-ground`, hairline top, mono for links and notes, `--text-meta`. Where the
app has privacy and delete-account pages and the site does not yet, the footer says so in one
sentence instead of linking nowhere.

**Links.** Default `--accent-text`, hover `--text`, no underline in navigation, underline in
body copy. Set both states explicitly: an unstyled link is browser blue and breaks the page.

---

## 7. Imagery

Period plates only. **No stock photography, no illustration, no AI-gradient abstractions, no
emoji, no icon sets invented for the occasion.**

- Crops: **4:5** at 1080x1350 for stops, **3:2** at 1500x1000 for the era viewer, **16:9** at
  1920x1080 for section headers, full-bleed for the hero.
- Every plate sits under a scrim so type stays legible:
  `linear-gradient(transparent, rgba(7,9,13,0.86) 62%, #07090d)` at the bottom, and a 120px
  top scrim wherever text or chrome overlaps. **These scrims stay dark in light mode.**
- Plates carry a caption in mono: source and, where relevant, confidence tier. An uncredited
  historical image on a page about trustworthy history is a contradiction.
- Placeholders while art is pending: `--ground-recessed` field, a 58 degree hairline stripe
  pattern at about 7% accent, and a centred mono label naming the crop
  (`PERIOD PLATE · 4:5 · 1080×1350`). A labelled placeholder is better than a wrong image.

### 7.1 Every plate exists twice

A plate ships as two files: `NAME.jpg` for dark and `NAME-light.jpg` for light. They are
swapped by a `<picture>` source, which is native and needs no JavaScript for the system
preference:

```html
<picture>
  <source data-plate media="(prefers-color-scheme: light)" srcset="/plates/NAME-light.jpg">
  <img src="/plates/NAME.jpg" alt="...">
</picture>
```

A `<source media>` only listens to the system, so when a reader pins a theme the script
rewrites that media to `all` or `not all`. That is the same trick the `theme-color` metas use.
The browser downloads only the source it ends up using, so the second file costs nothing.

### 7.2 Toning (do this before adding any plate)

Historical engravings are dark ink on cream paper. Dropped in raw they blow out against the
near-black ground: the New York 1880 photograph arrived with a pure white sky. So the tone is
**baked into the file**, not applied as a CSS filter. That is cheaper at runtime, it survives
into both themes, and it makes the file itself the truth.

```sh
magick SOURCE -crop WxH+X+Y +repage -resize 1500x \
  -colorspace Gray -auto-level +level-colors '#07090d,#9a9080' -colorspace sRGB \
  -strip -interlace JPEG -sampling-factor 4:2:0 -quality 62 public/plates/NAME.jpg
```

The second colour is the highlight ceiling and it is the only knob you normally touch:

| Source | Ceiling | Example |
|---|---|---|
| Already dark engraving | `#c2b49a` | Doré, Over London by Rail |
| Lighter engraving | `#a89b84` | Doré, The Ladies' Mile |
| Cream-paper etching | `#9a9080` | Piranesi, Campo Vaccino |
| Photograph | `#8f8471` | Oxford Circus, 1940 |

The light file is the same idea inverted: a dark floor, a paper ceiling, and a gamma lift so
the paper carries the image rather than the ink.

```sh
magick SOURCE -crop WxH+X+Y +repage -resize 1500x \
  -colorspace Gray -auto-level -gamma 1.45 +level-colors '#30261b,#fbf6ea' -colorspace sRGB \
  -strip -interlace JPEG -sampling-factor 4:2:0 -quality 66 public/plates/NAME-light.jpg
```

Gamma is the knob here: 1.15 for a photograph that is already bright, 1.45 for a dense
engraving. Aim for a mean of roughly 130 to 165, high enough to read as paper, low enough to
keep its ink. The dark file aims for roughly 60 to 100; check with
`magick FILE -format '%[fx:int(mean*255)]' info:`. Leave a plate in colour only when the colour
is the subject: the 1666 fire painting keeps its flames, since they are the only warm light in
it and they happen to be amber.

WebP was measured and rejected for these images. Dense engraving hatching defeats it, and the
WebP files came out larger than progressive JPEG at matching quality.

---

## 8. Motion

The app uses springs, and the site should feel related without imitating a native sheet.

- Entrances: 12 to 16px rise plus opacity, spring-shaped
  (`cubic-bezier(0.22, 1, 0.36, 1)`, about 420ms), staggered 60ms across a group. Never a bounce
  on something that did not move under a finger.
- Entrances are a **progressive enhancement**. The hiding rule is `.js .reveal`, and the `js`
  class is added by a script in `<head>`, so with JavaScript off nothing is ever invisible.
- Hover: opacity and colour only, about 120ms. No scale on cards, no tilt, no cursor followers.
- Theme change: 220ms colour transition on grounds, surfaces and borders. **A theme change is a
  colour change, never a layout change.** Nothing moves, nothing reflows, no image is swapped.
- Scroll: at most a slow vignette or scrim shift. No parallax layers, no scroll-jacking, no
  pinned-section carousels.
- `@media (prefers-reduced-motion: reduce)`: all transforms off, opacity only, no autoplay.
- Any hero video is muted, 8s or less, poster-framed, and must never be the only way to
  understand the page.

---

## 9. Voice

Matter-of-fact. Concrete places, concrete years. Short declaratives.

- Write "London, 1850. Gaslight, coal smoke, the newspaper trade." Not "Discover the wonders
  of Victorian London!"
- Name what exists and what does not. Three cities, seven eras, one reconstructed. Say so.
- Never oversell the model. Generated means generated, and the word appears on the page.
- No exclamation marks. No "unlock". No "journey" as a verb. No dashes of any length: use a
  comma or a full stop.
- Numbers are real: 6 stops, 42 minutes, on foot.

---

## 10. Tokens

Colour is in two layers. Read them top to bottom and the rest of the stylesheet follows.

```css
:root{
  /* 1. brand scale: fixed values, never themed */
  --ink-900:#07090d; --ink-800:#0b0e14; --ink-700:#11151c;
  --paper:#f4ecd8; --grey-300:#cbd1de; --grey-500:#7d8597;
  --amber:#e8b86a; --amber-hover:#f0c884;
  --bronze:#9a5f1e; --bronze-hover:#7d4c15; --bronze-text:#8a5a1f;
  --parchment:#f7f2e7; --parchment-deep:#efe8d7; --parchment-lift:#fffdf8;
  --soot:#14110c;

  /* 2. roles: dark is the default, light overrides these and only these.
        This includes the hero, the phone, the plates, the viewer and the map. */
  --ground:#07090d; --ground-recessed:#0b0e14; --surface:#11151c;
  --footer-ground:#11151c; --header-ground:rgba(17,21,28,.78);
  --text:#f4ecd8;
  --text-90:rgba(244,236,216,.90); --text-86:rgba(244,236,216,.86);
  --text-84:rgba(244,236,216,.84); --text-74:rgba(244,236,216,.74);
  --text-62:rgba(244,236,216,.62); --text-50:rgba(244,236,216,.50);
  --text-2:#cbd1de; --text-meta:#7d8597;
  --hairline:rgba(244,236,216,.10); --rule:rgba(244,236,216,.18);
  --node:rgba(244,236,216,.30); --border:rgba(244,236,216,.24);
  --border-hover:rgba(244,236,216,.48); --tint:rgba(244,236,216,.03);
  --accent:#e8b86a; --accent-hover:#f0c884; --accent-text:#e8b86a;
  --accent-dim:rgba(232,184,106,.72); --accent-on:#11151c;
  --accent-ring:rgba(232,184,106,.45); --accent-halo:rgba(232,184,106,.22);
  --select:rgba(232,184,106,.28);
  --known-line:rgba(232,184,106,.65);
  --likely-line:rgba(203,209,222,.42);
  --generated-line:rgba(125,133,151,.70);
  --shadow-lift:0 34px 90px rgba(0,0,0,.66); --shadow-pin:0 2px 10px rgba(0,0,0,.6);

  /* type, space, shape: never themed */
  --display:'Cormorant Garamond',Georgia,serif;
  --ui:Inter,system-ui,-apple-system,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  --r-chip:6px; --r-ui:12px; --r-card:20px;
  --measure:62ch; --page:1180px; --section:112px;
  --ease:cubic-bezier(.22,1,.36,1);
  color-scheme:dark;
}

/* the light theme is the same block twice: once for the system preference,
   once for an explicit pin. Keep the two lists identical. */
@media (prefers-color-scheme:light){ :root:not([data-theme="dark"]){ /* light values */ } }
:root[data-theme="light"]{ /* the same light values */ }
```

The light values, in full, are in `public/style.css`. The two light blocks must stay in step:
if you change one, change the other in the same commit.

---

## 11. Working in this system

**Adding a colour.** Do not write a hex or an rgba inside a component rule. Add a role token,
give it a dark value and a light value, then use the token. Scrims and gradients are tokens
too (`--hero-scrim`, `--plate-scrim`, `--viewer-scrim`), because each one has to fade to its
own theme's ground.

**Adding a component.** Build it in dark, then read it in light before you commit. The usual
misses are a hard-coded scrim, a colour sitting in an SVG `fill` attribute, and a black shadow
that reads as dirt on parchment.

**Changing a shared value.** Check both themes before committing. A change that looks fine on
ink can vanish on paper: `--hairline` at 10% is a visible divider on `#07090d` and nearly
invisible on `#f7f2e7`, which is why the light value is 14%.

**Checking contrast.** Every text colour on this site was measured against its real rendered
background, not eyeballed. Body copy clears 7:1 and everything else clears 4.5:1 in both
themes. Re-measure after any palette change rather than trusting the table above.

---

## 12. Don't

- Don't put a second accent colour next to the amber or the bronze.
- Don't use amber on a light ground, or bronze on a dark one. Each belongs to its theme.
- Don't use Cormorant for body copy or buttons.
- Don't let a theme change move anything. Colour only.
- Don't leave anything dark in light mode. If a component only works on ink, it is not done.
- Don't put a colour in an SVG `fill` or `stroke` attribute. Give the node a class and style it,
  or it will be stuck in one theme.
- Don't use rounded cards with a left accent border, aggressive gradients, or glassmorphism
  beyond the single blur used on the header and floating controls.
- Don't show a UI screenshot of the arrival screen. It isn't designed yet.
- Don't imply offline mode, GPS arrival detection, a chat guide, or paid tiers. None ship at
  launch, and the site must not promise them. Where the roadmap names them, it says plainly
  that they are not in the first release and have no date.
- Don't show App Store or Google Play buttons until there is something behind them. Until then
  the honest control is the waitlist.
