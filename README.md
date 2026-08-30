# worldasitwas-web

Marketing site for **World As It Was**, an app that rebuilds a city as it stood in a chosen
year. Choose a place, choose a year, press Travel.

Live at [worldasitwas.com](https://worldasitwas.com). The product itself is live at
[app.worldasitwas.com](https://app.worldasitwas.com), so this site's job is to hand people
over to it, not to take their address and promise something later.

## What is here

A single static page plus a small Node server. No framework, no build step, no client-side
dependencies at all: the page loads no third-party JavaScript.

```
public/
  index.html      the page (structure, content and the era-scrubber script)
  style.css       all styling, driven by the design tokens in :root
  404.html
  plates/         period plates, pre-toned (see "Plates" below)
  app/            screenshots of the live app, played inside the hero phone
  phone.js        picks which app screen the hero phone is showing
  qr-app.svg      the handoff code, ink on paper, decodes to https://app.worldasitwas.com/
tools/
  shoot-app.mjs   re-shoots public/app/ from the live app, both themes
  robots.txt, sitemap.xml
server.js         static file server: brotli/gzip, cache headers, www -> apex, /health
```

## Run locally

```sh
npm start          # http://localhost:3000
```

`PORT` is read from the environment (Railway sets it). `CANONICAL_HOST` controls the
www to apex redirect and defaults to `worldasitwas.com`.

## Design

**[DESIGN.md](DESIGN.md) is the design system.** Read it before changing anything visual. It
covers both themes, the palettes with their measured contrast ratios, typography, components,
the plate toning recipe and the rules that are easy to break by accident.

The short version. The site follows the app's **Archive** direction: near-black grounds, one
amber accent, Cormorant Garamond italic for places and years, Inter for everything else, and a
monospace for data. Colour is in two layers at the top of `style.css`: a fixed brand scale, and the role tokens
that flip with the theme.css`: a fixed brand scale,
the fixed `--night-*` island, and the role tokens that flip with the theme. Never write a raw
colour into a component rule.

Three rules worth keeping:

- **The accent marks three things only:** something you can act on, something that is live or
  ready, and the Known confidence tier. It is never decoration.
- **Confidence is shown, not hidden.** Known, Likely and Generated are marked on the words
  themselves (`.known`, `.likely`, `.generated`), on the sample narration and on every value
  in the arrival record.
- **Both themes go all the way.** Nothing stays dark in light mode. Every plate ships twice, a
  dark file and a `-light` one, swapped by a `<picture>` source; the SVG map is styled from CSS
  classes so it follows the theme too.

## Themes

Dark is the default. Light comes on automatically with `prefers-color-scheme`, and the header
toggle pins a choice in `localStorage` (`waiw-theme`), applied by a script in `<head>` before
first paint so there is no flash. Priority is pinned, then system, then dark.

The light values appear twice in `style.css`, once under the media query and once under
`[data-theme="light"]`. Keep the two blocks identical.

## The era scrubber

The timeline section is the one interactive piece. A real `<input type="range">` drives it,
so keyboard and screen readers work; the year buttons underneath set the same state. Era
content lives in the `ERAS` array in `index.html`. To add an era, add an entry, add a
`.viewer-layer` for its plate, add a button, and widen the range `max`.

Entrance animations are progressive enhancement: `.reveal` is only hidden when the document
has the `js` class, so with JavaScript off nothing is invisible.

## The phone

The phone in the hero is not a drawing of the product. It plays **photographs of the live
app** at app.worldasitwas.com: the world map with every built city on it, and the sheet that
slides up when you pick one. `phone.js` only adds and removes one class; the slide is a CSS
transition, so with JavaScript off, with the effect switched off in the lab, or for a reader
who asked for reduced motion, the phone is a still of the app rather than an empty frame.

There used to be a hand-drawn React widget here. It is gone, and so are the two React scripts
the page pulled from a CDN for it, which is why the page now loads no third-party JavaScript.

**These screens go stale the moment the app changes.** Take them again with:

```sh
node tools/shoot-app.mjs
```

It needs Chrome and ImageMagick 7, and no npm packages. It drives a real browser because the
app decides what to draw from the device it is on:

- It gates on `@media (pointer:fine)`, so the browser has to be **emulating touch** or every
  screenshot comes back as "This one is made for a phone". The script fails loudly if that
  happens rather than writing the gate into `public/app/`.
- The map is MapLibre, so **software WebGL** has to be on or headless Chrome draws nothing.
- It sets a remembered address in `localStorage` to skip the app's email door. That posts
  nothing to `/signup`, so re-shooting never writes a row to the app's database. It also
  marks the install prompt dismissed, because "Keep this on your home screen" is not what a
  marketing page should be showing.

The sheets are cropped away from the map and their top corners masked out to transparency, so
one image can slide over the other at any position. The script prints each sheet's height;
if a walk is added or removed those heights change, so update the matching `height` attribute
in `index.html` when it does.

The screen is sized to the captures exactly (`aspect-ratio:560/1212`), which is also what
keeps the map's OpenStreetMap attribution on screen rather than cropped off the bottom. The
tile licence needs it there.

## Plates

All images are public domain, from the Yale Center for British Art, the Library of Congress,
the Imperial War Museum, the Museum of London and The Metropolitan Museum of Art. They are
credited on the page and in the footer.

They are pre-toned into the ink palette so nothing blows out against the near-black ground,
using a duotone bake rather than a CSS filter (cheaper, and the tone is then the file's truth):

```sh
magick SOURCE -crop WxH+X+Y +repage -resize 1500x \
  -colorspace Gray -auto-level +level-colors '#07090d,#9a9080' -colorspace sRGB \
  -strip -interlace JPEG -sampling-factor 4:2:0 -quality 62 public/plates/NAME.jpg
```

Ceilings in use: `#c2b49a` for already-dark engravings, `#a89b84` for lighter engravings,
`#9a9080` for cream-paper etchings, `#8f8471` for photographs. The 1666 fire painting keeps
its colour, since the fire is the only warm light in it.

Tune by measuring, not by eye: a new plate should land inside the range the shipped ones
already occupy. For the 4:5 city plates that is a **mean of 82 to 100** on the dark ground
and **127 to 157** on the paper one, measured with
`magick FILE -colorspace Gray -format '%[fx:mean*255]' info:`. Stockholm needed `#928778`
and Colombo `#a09585` to get there, neither of which is the ceiling their material would
suggest, because the source histogram matters more than the medium.

Light variants use a raised floor and a ceiling below the paper, so the plate never goes
brighter than the page it sits on:

```sh
magick SOURCE -crop WxH+X+Y +repage -resize 1024x1280^ -gravity center -extent 1024x1280 \
  -colorspace Gray -auto-level +level-colors '#2a251e,#dbd2c0' -colorspace sRGB \
  -strip -interlace JPEG -sampling-factor 4:2:0 -quality 62 public/plates/NAME-light.jpg
```

## One action, two devices

The web app is a phone product, and it says so itself: it renders a gate, not the map, to
anything with a mouse (`@media (pointer:fine)` in the app's own stylesheet). So this site
asks the same question rather than guessing from screen width, and hands out a different
control on each side:

- **coarse pointer or none** (a phone, a tablet): `Open the app`, straight to
  `https://app.worldasitwas.com/`.
- **fine pointer** (a laptop): the QR code and the address, because that person cannot use
  the app on the screen they are looking at. There is still a quiet link through to it,
  labelled honestly.

Both controls are in the HTML and CSS picks one, so it is settled before the first paint and
works with JavaScript off. **The two rules live at the very end of `style.css` and carry
`!important`.** That is deliberate: they lost once to `.handoff`, declared later at the same
specificity, which put the QR code on phones. This is not styling, it is which of two links
a person is given, and the cost of losing is sending someone to a screen that turns them
away.

A matching pair of media queries is the whole mechanism:

```css
@media not all and (pointer:fine){ .for-desktop{display:none!important} }
@media (pointer:fine){ .for-phone{display:none!important} }
```

They are exact complements, so precisely one always applies, including on a browser too old
to know the `pointer` feature at all.

## Waitlist

The apps are not in the stores yet. The waitlist is no longer the page's main action, it
sits under the launch panel and promises one specific thing: an email the day the store
versions land. The app has its own, separate email door for a different promise (when a
city becomes ready), which is why a person can be asked twice.

- `POST /api/waitlist` takes `{email, platform, company}`. `company` is a honeypot: anything
  that fills it gets a cheerful 200 and no write. Rate limited to 6 posts per IP per 10
  minutes, addresses are never logged, and a repeat sign-up is a no-op via
  `ON CONFLICT DO NOTHING`.
- `GET /api/waitlist?key=...` returns the count, a breakdown by platform and the 500 most
  recent rows. Add `&format=csv` for a download. Any other key, or none, gets a 404 rather
  than a 401, so the endpoint does not advertise itself. The key lives in `WAITLIST_ADMIN_KEY`.
- Storage is one table, created on boot (`db.js`): `email`, a lowercased `email_key` with a
  unique index, `platform`, `source`, `created_at`. No IP address, no user agent.
- `DATABASE_URL` is a Railway reference to the `postgres` service in the same project, so the
  app reaches it over the private network with no TLS. The public proxy URL needs
  `ssl: { rejectUnauthorized: false }`; `db.js` picks the right mode from the URL.

## Keeping the page honest

The archive is a claim about what exists, so it is written from the app's own catalogue, not
from memory. `GET https://app.worldasitwas.com/places` returns every city with its eras and
each era's `status` and `durationMin`; the page should list exactly the ones that say
`ready`. At the time of writing that is twelve walks across London, Rome, Stockholm and
Colombo, thirteen to sixteen minutes each, all free, with sixty eight more cities in the
picker that are not built. **Re-check it whenever a walk ships**, or the page starts
underselling the product, which is what it had been doing.

Still outstanding:

- Store links, once the apps exist.
- Per-city links into the app. It is a single page today and the URL carries no city, so
  every `Travel` button can only open the map.

## Deploy

Pushing to `main` auto-deploys to Railway (project `worldasitwas-web`). `GET /health`
returns `{"ok":true}`.
