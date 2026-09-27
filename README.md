# demos

My portfolio of demo websites. **This whole folder is one Git repo and one Cloudflare Pages
project.** Set up once; every demo after that goes live by adding a folder and pushing.

```
demos\
  index.html              the showcase page clients land on
  .gitignore
  _template\              starting point for a new demo pair
  anna-mills-premium\
  kestrel-premium\
  kestrel-standard\
  calder-finch-premium\
```

## Live at

**https://demos-1g7.pages.dev/** — the showcase page
https://demos-1g7.pages.dev/anna-mills-premium/
https://demos-1g7.pages.dev/kestrel-premium/
https://demos-1g7.pages.dev/kestrel-standard/
https://demos-1g7.pages.dev/calder-finch-premium/

GitHub: `Sidak-dang/demos` · Cloudflare Pages project: `demos-1g7`

`demos.pages.dev` was taken, so Cloudflare added `-1g7`. To lose it, point a real domain at
this project under **Custom domains** in the Cloudflare dashboard and send clients that.

---

## Adding a new demo

**1. Make the folder.** `brand-name-standard` or `brand-name-premium`. Lowercase, hyphens.
Put `index.html` inside, with any `js/`, `logo.png` etc. in that same folder.

**2. Add a card to the root `index.html`.** Copy an existing `<a class="card">` block. The
opening tag **must** carry both attributes or the picker won't see it:

```html
<a class="card" data-slug="brand-name-premium" data-sector="Immigration" href="brand-name-premium/" target="_blank" rel="noopener">
```

- `data-slug` — must exactly match the folder name
- `data-sector` — the industry. Reuse an existing spelling (`Immigration`, `Food & FMCG`)
  or add a new one; each distinct value becomes a quick-filter button in the picker.

Also pick a card background: reuse `art-1` … `art-4`, or add an `.art-5` rule in the CSS.

**3. Push.**

```powershell
git add .
git commit -m "Add brand-name-premium demo"
git push
```

Cloudflare rebuilds on its own. Live in about a minute.

**4. Check it in a browser.** Open the new URL and scroll the whole page. Don't trust that
the files are right because the commands succeeded.

---

## The picker — sending a client only the relevant demos

**Control panel:** https://demos-1g7.pages.dev/?pick ← bookmark this

Tick the demos you want, press **Copy link**, send it. Quick buttons for All, None, and one
per industry.

The selection is stored **inside the link** (`?show=kestrel-premium,kestrel-standard`), not
on a server. So every link is independent: sending a new one never changes an old one, and
there's nothing to maintain.

Two things to remember:

- **It isn't private.** Anyone can trim the URL and see everything. It's tidying, not security.
- **Don't split a tier pair.** Standard + Premium of the same brand side by side is the whole
  sales argument. Filter by industry, keep both tiers.

Below about ten demos, filtering makes you look thin rather than curated. Use the plain
link until the library is bigger.

---

## Turning a real client concept into a demo

Concept sites built for a real prospect carry that company's identity in more places than a
search will find. This list exists because two rebrands here missed things:

- [ ] **Company name split across tags** — a two-tone logo is `<b>NOVA<span>WORLD</span></b>`.
      Searching for "NovaWorld" finds nothing. Search for each half separately.
- [ ] **Text painted onto a canvas by JavaScript** — `fillText('NOVA')` in a `.js` file.
      Invisible to any search of the HTML.
- [ ] **Image files** — a `logo.png` is the client's actual mark. Replace the file.
- [ ] **Phone numbers in every format** — `+1 (647) 404-6682`, `647-404-6682`, `6474046682`,
      `tel:+1647...`, `wa.me/1647...`. Search for the digits alone.
- [ ] **Street address**, including inside a Google Maps query string
- [ ] **Named people** — swap for `[Consultant Name]`, never invent a replacement person
- [ ] **The founder's biography and dates** — arrival year, licence year, the whole story.
      Changing the name but keeping "arrived as a student in 2004" keeps the real person.
- [ ] **Office locations**, including latitude/longitude and timezone strings in map code
- [ ] **Reference codes** — file numbers like `NW-2004-001` carry the old initials
- [ ] **`<meta name="robots" content="noindex">`** — add it if the original lacked one
- [ ] **The disclaimer** — must say the firm is fictional, not "not the official X site"

**Check the invented name is free before using it.** Search it. "Northway Immigration" and
"Ardent Immigration" both turned out to be real Canadian firms. In a crowded industry,
assume any plausible name is taken until proven otherwise.

**Then open the page and scroll all of it.** A find-and-replace can't see split tags or
canvas text; your eyes can.

---

## The two-copies rule

Every brand gets **both** tiers so a client can put them side by side and see what the extra
money buys. A Premium demo on its own only says "expensive".

A brand with one tier built is an open item, not a finished demo.

## Made-up brands

Demo brands are invented. Every demo carries a fictional-company note in its footer and
`noindex` in its head. Keep both when you add one.

Real client work does **not** go here. It gets its own repo under `Websites\live\` or
`Websites\building\`.

## Rules for this repo

- Static files only — no build step. Cloudflare serves the folder as-is, which is why
  there's nothing to configure and nothing to break.
- Each demo is self-contained. No shared CSS or JS between demos: edit a shared file for one
  and you silently break the other.
- External libraries load from a CDN (`cdn.jsdelivr.net`). That's fine.
