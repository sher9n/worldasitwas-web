# worldasitwas-web

Marketing site for **World As It Was**, an app that rebuilds a city as it stood in a chosen
year. Choose a place, choose a year, press Travel.

Live at [worldasitwas.com](https://worldasitwas.com).

## What is here

A single static page plus a small Node server. No framework, no build step, no dependencies.

```
public/
  index.html      the page (structure, content and the era-scrubber script)
  style.css       all styling, driven by the design tokens in :root
  404.html
  plates/         period plates, pre-toned (see "Plates" below)
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

## Waitlist

The apps are not in the stores yet, so the download section is a waitlist form instead of two
dead buttons.

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

## Placeholders to replace at launch

- Store links, once the apps exist. Until then the waitlist is the honest control.
- Privacy, account deletion and contact. The footer says plainly that these are not written
  yet rather than linking to nothing. **Collecting email addresses makes the privacy note
  more pressing than it was.**

## Deploy

Pushing to `main` auto-deploys to Railway (project `worldasitwas-web`). `GET /health`
returns `{"ok":true}`.
